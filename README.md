Aşkım hemen sana pürüzsüz ve akademik bir İngilizce çeviri yapıyorum — aynı formatı koruyarak:

---

# **RL Racing Line Agent**

## **About the Project**

This project is a **Reinforcement Learning (RL)** application designed to enable an AI agent to discover the optimal racing line on a 2D race track.

The agent is trained using the **Deep Q-Network (DQN)** algorithm. Through trial-and-error, it learns when to accelerate, when to steer, and how to stay within the track boundaries entirely on its own.

## **Why I Built This Project (Motivation)**

The “racing line” that drivers follow on a track is crucial for completing a lap in the shortest possible time while staying within physical limits. In autonomous driving and robotics, this problem is known as **trajectory planning**.

Instead of using classical mathematical modeling, this project aims to explore modern AI techniques where the vehicle learns everything from scratch without being explicitly programmed.

## **Technical Details**

### **1. Simulation Environment**

A custom racing environment (`RacingLineEnv`) was created using Python and the Gymnasium library.

* **Inputs (Observations):**
  The vehicle uses five virtual laser sensors (raycasts) to measure its distance to the track boundaries. It also knows its current speed and orientation.

* **Actions:**
  The agent has three possible actions:
  `Turn Left`, `Go Straight`, `Turn Right`.

* **Reward System:**

  * **+Reward** for moving forward on the track
  * **-Penalty** for going off-track (crash → episode ends)
  * **Small Penalty** when deviating too far from the centerline (to encourage safe and optimal driving)

### **2. Algorithm (DQN)**

A simple Neural Network was implemented using PyTorch.

* **Experience Replay:**
  The agent stores its experiences (State, Action, Reward) in memory. During training, random samples are used to improve stability.

* **Epsilon-Greedy Strategy:**
  At the beginning of training, the agent acts fully randomly (exploration). Over time, randomness decreases as it begins to exploit what it has learned.

## **Installation & Running**

To run this project on your computer:

### **1. Install Required Libraries**

Make sure Python is installed and enter the following in your terminal:

```bash
pip install torch gymnasium numpy
```

### **2. Start Training**

Open the project directory in your terminal and run:

```bash
python train_dqn_agent.py
```

*The agent will begin training, and progress will be printed every 10 episodes.*

### **3. File Structure**

* `racing_env.py` — Defines the race track and physics
* `train_dqn_agent.py` — Contains the DQN model and training loop
