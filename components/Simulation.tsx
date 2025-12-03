import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrackCanvas } from './TrackCanvas';
import { RacingEnv } from '../services/racerEnv';
import { DQNAgent } from '../services/dqnAgent';
import { TrackConfig, EpisodeStats } from '../types';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Generate a simple loop track
const generateTrack = (): TrackConfig => {
  const points = [];
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    // S-Shape / Figure 8-ish or simple Oval with variation
    const x = 120 * Math.cos(t);
    const y = 80 * Math.sin(t) + 30 * Math.sin(2 * t); // slight twist
    points.push({ x, y });
  }
  return { centerLine: points, width: 20 };
};

const TRACK = generateTrack();
const ENV = new RacingEnv(TRACK);
const AGENT = new DQNAgent(5, 3); // 5 sensors, 3 actions

export const Simulation: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [speedMult, setSpeedMult] = useState(1);
  const [episode, setEpisode] = useState(0);
  const [stats, setStats] = useState<EpisodeStats[]>([]);
  const [currentReward, setCurrentReward] = useState(0);
  const [epsilon, setEpsilon] = useState(1.0);
  
  // Ref for animation loop
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // State for rendering
  const [carState, setCarState] = useState(ENV.car);

  const step = useCallback(() => {
    // If not running, just return
    if (!isRunning) return;

    // Run multiple physics steps per frame if fast forwarding
    const stepsPerFrame = speedMult;
    
    for (let i = 0; i < stepsPerFrame; i++) {
        const state = ENV.getObservations();
        const action = AGENT.act(state);
        const { nextState, reward, done } = ENV.step(action);

        AGENT.remember({
            state,
            action,
            reward,
            nextState,
            done
        });

        // Train
        AGENT.replay();

        setCurrentReward(prev => prev + reward);

        if (done) {
            // Log stats
            setStats(prev => {
                const newStats = [...prev, {
                    episode: episode + 1,
                    totalReward: Math.floor(ENV.steps > ENV.maxSteps ? currentReward : currentReward + reward), // adjust
                    steps: ENV.steps,
                    epsilon: AGENT.epsilon
                }];
                return newStats.slice(-50); // Keep last 50 for chart
            });

            // Update Episodic State
            setEpisode(e => e + 1);
            setEpsilon(AGENT.epsilon);
            
            // Soft reset target occasionally
            if (episode % 5 === 0) AGENT.updateTargetModel();

            ENV.reset();
            setCurrentReward(0);
            break; // Stop stepping this frame if done
        }
    }

    setCarState({...ENV.car});
    requestRef.current = requestAnimationFrame(step);
  }, [isRunning, speedMult, episode, currentReward]);

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(step);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, step]);

  const togglePlay = () => setIsRunning(!isRunning);
  const reset = () => {
    setIsRunning(false);
    ENV.reset();
    setCarState({...ENV.car});
    setCurrentReward(0);
    // Optionally reset agent? No, keep learned brains.
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Sim View */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700 relative">
            <div className="absolute top-4 left-4 flex gap-2 z-10">
                <button onClick={togglePlay} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow transition">
                    {isRunning ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button onClick={reset} className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white shadow transition">
                    <RotateCcw size={20} />
                </button>
                <button onClick={() => setSpeedMult(prev => prev === 1 ? 5 : prev === 5 ? 20 : 1)} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white shadow transition flex items-center gap-1 font-bold">
                    <FastForward size={20} />
                    <span className="text-xs">{speedMult}x</span>
                </button>
            </div>
            
            <div className="absolute top-4 right-4 bg-slate-900/80 p-2 rounded text-xs text-slate-300 backdrop-blur font-mono">
                <div>Eps: {episode}</div>
                <div>Reward: {currentReward.toFixed(1)}</div>
                <div>Epsilon: {epsilon.toFixed(3)}</div>
            </div>

            <TrackCanvas car={carState} track={TRACK} width={600} height={400} />
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
             <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Real-time Training Performance</h3>
             <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="episode" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                            itemStyle={{ color: '#60a5fa' }}
                        />
                        <Line type="monotone" dataKey="totalReward" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">RL Racing Agent</h2>
            <p className="text-slate-400 text-sm mb-4">
                This simulation uses a Deep Q-Network (DQN) running entirely in your browser via TypeScript.
            </p>
            <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span>Algorithm</span>
                    <span className="text-blue-400 font-mono">DQN + Replay</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span>Network</span>
                    <span className="text-blue-400 font-mono">FC [5, 24, 3]</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span>Sensors</span>
                    <span className="text-blue-400 font-mono">5 Raycasts</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span>Action Space</span>
                    <span className="text-blue-400 font-mono">Left, Straight, Right</span>
                </div>
            </div>
            
            <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-yellow-200 text-xs">
                <strong>Tip:</strong> Use the speed multiplier to train faster. Watch the 'Reward' graph climb as the car learns to stay on the track.
            </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
             <h3 className="font-bold text-white mb-2">How it works</h3>
             <ul className="list-disc list-inside text-sm text-slate-400 space-y-2">
                <li><strong>Observation:</strong> The car casts 5 rays to detect the track edge.</li>
                <li><strong>Reward:</strong> +Progress, -Crash, -Lateral Deviation.</li>
                <li><strong>Learning:</strong> The agent explores randomly (epsilon) initially, storing experiences. It updates its neural network to predict the best action (Q-value) for any state.</li>
             </ul>
        </div>
      </div>
    </div>
  );
};