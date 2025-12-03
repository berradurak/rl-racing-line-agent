 # **RL Racing Line Agent**

## **About the Project**

This project is a **Reinforcement Learning (RL)** application designed to enable an AI agent to discover the optimal racing line on a 2D race track.

The agent is trained using the **Deep Q-Network (DQN)** algorithm. Through trial-and-error, it learns when to accelerate, when to steer, and how to stay within the track boundaries entirely on its own.

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

