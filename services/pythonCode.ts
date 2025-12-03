export const PYTHON_ENV_CODE = `import gymnasium as gym
from gymnasium import spaces
import numpy as np
import math

class RacingLineEnv(gym.Env):
    """
    A simplified 2D racing environment.
    Observation: [normalized_lateral_error, normalized_heading_error, speed]
    Actions: 0: Left, 1: Straight, 2: Right
    """
    metadata = {'render_modes': ['human', 'rgb_array'], 'render_fps': 30}

    def __init__(self):
        super(RacingLineEnv, self).__init__()

        # Define Track (Example: Oval)
        t = np.linspace(0, 2*np.pi, 100)
        self.track_x = 50 * np.cos(t)
        self.track_y = 30 * np.sin(t)
        self.track_width = 8.0
        
        # Action Space: 0=Left, 1=Straight, 2=Right
        self.action_space = spaces.Discrete(3)

        # Observation Space: [lateral_dist, relative_heading, speed]
        # Low/High bounds are approximate
        low = np.array([-1.0, -np.pi, 0.0], dtype=np.float32)
        high = np.array([1.0, np.pi, 10.0], dtype=np.float32)
        self.observation_space = spaces.Box(low, high, dtype=np.float32)

        self.dt = 0.1
        self.reset()

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.car_idx = 0  # Index of closest track point
        
        # Start at index 0
        self.x = self.track_x[0]
        self.y = self.track_y[0]
        
        # Point towards index 1
        dx = self.track_x[1] - self.track_x[0]
        dy = self.track_y[1] - self.track_y[0]
        self.heading = math.atan2(dy, dx)
        self.speed = 0.0
        self.steps = 0
        
        return self._get_obs(), {}

    def step(self, action):
        self.steps += 1
        
        # 1. Dynamics
        if action == 0: # Turn Left
            self.heading -= 0.15
        elif action == 2: # Turn Right
            self.heading += 0.15
            
        self.speed = 5.0 # Constant speed for simplicity
        
        self.x += self.speed * math.cos(self.heading) * self.dt
        self.y += self.speed * math.sin(self.heading) * self.dt
        
        # 2. Track Calculation (Find closest point)
        # Simple brute force for demo
        dists = np.sqrt((self.track_x - self.x)**2 + (self.track_y - self.y)**2)
        min_dist = np.min(dists)
        closest_idx = np.argmin(dists)
        
        # Update progress index
        self.car_idx = closest_idx
        
        # 3. Rewards & Done
        terminated = False
        reward = 0.0
        
        # Reward for staying on track
        if min_dist < self.track_width / 2:
            reward += 1.0 
            # Penalty for being far from center
            reward -= (min_dist / (self.track_width/2)) * 0.5
        else:
            reward = -10.0
            terminated = True # Off track
            
        if self.steps > 500:
            terminated = True
            
        return self._get_obs(), reward, terminated, False, {}

    def _get_obs(self):
        # Calculate simplified observations
        # In a real scenario, use raycasting or Frenet coordinates
        
        # 1. Lateral Error (signed distance roughly)
        # Using simple min_dist here for brevity
        dists = np.sqrt((self.track_x - self.x)**2 + (self.track_y - self.y)**2)
        lat_error = np.min(dists) / (self.track_width / 2)
        
        # 2. Heading Error relative to track tangent
        idx = np.argmin(dists)
        next_idx = (idx + 1) % len(self.track_x)
        tx = self.track_x[next_idx] - self.track_x[idx]
        ty = self.track_y[next_idx] - self.track_y[idx]
        track_heading = math.atan2(ty, tx)
        heading_error = self.heading - track_heading
        
        # Normalize to [-pi, pi]
        heading_error = (heading_error + np.pi) % (2 * np.pi) - np.pi
        
        return np.array([lat_error, heading_error, self.speed], dtype=np.float32)

    def render(self):
        pass # Implement Matplotlib or PyGame render here
`;

export const PYTHON_TRAIN_CODE = `import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import random
from collections import deque
from racing_env import RacingLineEnv

# 1. Define Q-Network
class DQN(nn.Module):
    def __init__(self, state_dim, action_dim):
        super(DQN, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(state_dim, 24),
            nn.ReLU(),
            nn.Linear(24, 24),
            nn.ReLU(),
            nn.Linear(24, action_dim)
        )
        
    def forward(self, x):
        return self.fc(x)

# 2. Hyperparameters
BATCH_SIZE = 32
GAMMA = 0.99
EPS_START = 1.0
EPS_END = 0.05
EPS_DECAY = 0.995
LR = 1e-3
MEMORY_SIZE = 10000

# 3. Training Loop
def train():
    env = RacingLineEnv()
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n
    
    policy_net = DQN(state_dim, action_dim)
    target_net = DQN(state_dim, action_dim)
    target_net.load_state_dict(policy_net.state_dict())
    
    optimizer = optim.Adam(policy_net.parameters(), lr=LR)
    memory = deque(maxlen=MEMORY_SIZE)
    
    epsilon = EPS_START
    
    for episode in range(1000):
        state, _ = env.reset()
        state = torch.tensor(state, dtype=torch.float32)
        total_reward = 0
        done = False
        
        while not done:
            # Epsilon Greedy
            if random.random() < epsilon:
                action = env.action_space.sample()
            else:
                with torch.no_grad():
                    action = policy_net(state.unsqueeze(0)).argmax().item()
            
            next_state_np, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            next_state = torch.tensor(next_state_np, dtype=torch.float32)
            
            # Store Memory
            memory.append((state, action, reward, next_state, done))
            state = next_state
            total_reward += reward
            
            # Train Step
            if len(memory) > BATCH_SIZE:
                batch = random.sample(memory, BATCH_SIZE)
                states, actions, rewards, next_states, dones = zip(*batch)
                
                states = torch.stack(states)
                next_states = torch.stack(next_states)
                rewards = torch.tensor(rewards, dtype=torch.float32)
                dones = torch.tensor(dones, dtype=torch.float32)
                actions = torch.tensor(actions).unsqueeze(1)
                
                # Q(s, a)
                current_q = policy_net(states).gather(1, actions).squeeze(1)
                
                # Max Q(s', a')
                with torch.no_grad():
                    next_q = target_net(next_states).max(1)[0]
                
                target_q = rewards + (1 - dones) * GAMMA * next_q
                
                loss = nn.MSELoss()(current_q, target_q)
                
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
        # Epsilon Decay
        epsilon = max(EPS_END, epsilon * EPS_DECAY)
        
        # Update Target Net occasionally
        if episode % 10 == 0:
            target_net.load_state_dict(policy_net.state_dict())
            
        print(f"Episode {episode}: Reward {total_reward:.2f}, Epsilon {epsilon:.2f}")

    # Save
    torch.save(policy_net.state_dict(), "dqn_racing_agent.pth")

if __name__ == "__main__":
    train()
`;
