import { SimpleNN } from './simpleNN';

interface Experience {
  state: number[];
  action: number;
  reward: number;
  nextState: number[];
  done: boolean;
}

export class DQNAgent {
  model: SimpleNN;
  targetModel: SimpleNN;
  
  // Hyperparameters
  gamma: number = 0.95;
  epsilon: number = 1.0;
  epsilonMin: number = 0.05;
  epsilonDecay: number = 0.995;
  learningRate: number = 0.001;
  batchSize: number = 32;

  memory: Experience[] = [];
  maxMemory: number = 2000;

  constructor(inputSize: number, actionSize: number) {
    this.model = new SimpleNN(inputSize, 24, actionSize);
    this.targetModel = new SimpleNN(inputSize, 24, actionSize);
    this.updateTargetModel();
  }

  updateTargetModel() {
    this.targetModel.copyFrom(this.model);
  }

  act(state: number[]): number {
    if (Math.random() <= this.epsilon) {
      return Math.floor(Math.random() * this.model.outputSize);
    }
    const qValues = this.model.predict(state);
    // Argmax
    return qValues.indexOf(Math.max(...qValues));
  }

  remember(experience: Experience) {
    if (this.memory.length >= this.maxMemory) {
      this.memory.shift();
    }
    this.memory.push(experience);
  }

  replay() {
    if (this.memory.length < this.batchSize) return;

    // Random sample (simplified for performance, taking random index slices might be better but let's loop)
    const indices = [];
    for(let i=0; i<this.batchSize; i++) {
        indices.push(Math.floor(Math.random() * this.memory.length));
    }

    for (const idx of indices) {
        const { state, action, reward, nextState, done } = this.memory[idx];

        let target = reward;
        if (!done) {
            const nextQ = this.targetModel.predict(nextState);
            target = reward + this.gamma * Math.max(...nextQ);
        }

        // Perform one gradient descent step
        this.model.train(state, action, target, this.learningRate);
    }

    // Decay epsilon
    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }
}