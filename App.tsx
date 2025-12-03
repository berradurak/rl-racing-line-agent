import React, { useState } from 'react';
import { Simulation } from './components/Simulation';
import { CodeViewer } from './components/CodeViewer';
import { Cpu, Code, BookOpen } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'sim' | 'code' | 'readme'>('sim');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Cpu size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">RL Racing Line <span className="text-blue-500">Agent</span></h1>
            </div>
            
            <nav className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('sim')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'sim' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    Simulation
                </button>
                <button 
                    onClick={() => setActiveTab('code')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    <Code size={14} /> Python Code
                </button>
                 <button 
                    onClick={() => setActiveTab('readme')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'readme' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    <BookOpen size={14} /> README
                </button>
            </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'sim' && <Simulation />}
        
        {activeTab === 'code' && (
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Python Implementation</h2>
                    <p className="text-slate-400">
                        While the simulation above runs in TypeScript for the web, here is the complete PyTorch + Gym implementation requested for the project. 
                        You can copy these files to run a headless training session on your local machine.
                    </p>
                </div>
                <CodeViewer />
            </div>
        )}

        {activeTab === 'readme' && (
            <div className="max-w-3xl mx-auto bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl">
                <article className="prose prose-invert prose-slate max-w-none">
                    <h1>RL Racing Line Agent</h1>
                    <p className="lead">
                        A reinforcement learning project demonstrating how an autonomous agent learns optimal racing lines using Deep Q-Networks (DQN).
                    </p>
                    
                    <h3>Project Overview</h3>
                    <p>
                        This project simulates a simplified 2D top-down racing environment. An AI agent controls a car (steering) with the goal of minimizing lap times while staying within track boundaries. 
                        Using Reinforcement Learning, specifically a Deep Q-Network, the agent discovers the "Racing Line"—the optimal path that maximizes speed and minimizes distance.
                    </p>

                    <h3>Motivation</h3>
                    <p>
                        Racing line optimization is a classic problem in motorsport engineering and trajectory planning for autonomous vehicles. 
                        While traditional methods use control theory (e.g., MPC), RL offers a model-free approach where the agent learns physics and strategy purely through trial and error.
                    </p>

                    <h3>Environment Description</h3>
                    <ul>
                        <li><strong>State Space:</strong> 5 Raycast sensors (measuring distance to track edge), speed, and heading.</li>
                        <li><strong>Action Space:</strong> Discrete [Turn Left, Straight, Turn Right].</li>
                        <li><strong>Reward Function:</strong>
                            <ul>
                                <li><code>+Progress</code>: Reward for moving towards the next checkpoint.</li>
                                <li><code>-Penalty</code>: Large negative reward for going off-track.</li>
                                <li><code>-Stability</code>: Small penalty for being too far from the centerline (encourages safety early on).</li>
                            </ul>
                        </li>
                    </ul>

                    <h3>RL Algorithm (DQN)</h3>
                    <p>
                        We utilize a <strong>Deep Q-Network</strong>. The agent uses a neural network to approximate the Q-value function <code>Q(s, a)</code>, which estimates the expected future reward for taking action <code>a</code> in state <code>s</code>.
                    </p>
                    <ul>
                        <li><strong>Experience Replay:</strong> Stores past transitions to break correlation between consecutive training samples.</li>
                        <li><strong>Target Network:</strong> A separate network is used to calculate target Q-values, stabilizing training.</li>
                        <li><strong>Epsilon-Greedy:</strong> Balances exploration (random actions) and exploitation (using learned knowledge).</li>
                    </ul>

                    <h3>How to Run (Python)</h3>
                    <pre><code>
# 1. Create Environment
python -m venv .venv
source .venv/bin/activate

# 2. Install Dependencies
pip install torch gymnasium numpy

# 3. Run Training
python train_dqn_agent.py
                    </code></pre>
                </article>
            </div>
        )}
      </main>
    </div>
  );
}

export default App;