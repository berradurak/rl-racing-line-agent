import { createMatrix, randomNormal } from './mathUtils';

// A minimal Fully Connected Network for the browser
// Structure: Input -> Dense -> ReLU -> Dense -> Output (Q-values)
export class SimpleNN {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
  
  // Weights and Biases
  W1: number[][];
  b1: number[];
  W2: number[][];
  b2: number[];

  constructor(inputSize: number, hiddenSize: number, outputSize: number) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    // Xavier/He Initialization
    const scale1 = Math.sqrt(2.0 / inputSize);
    this.W1 = createMatrix(inputSize, hiddenSize, () => randomNormal(0, scale1));
    this.b1 = new Array(hiddenSize).fill(0);

    const scale2 = Math.sqrt(2.0 / hiddenSize);
    this.W2 = createMatrix(hiddenSize, outputSize, () => randomNormal(0, scale2));
    this.b2 = new Array(outputSize).fill(0);
  }

  // Forward pass
  predict(inputs: number[]): number[] {
    // Hidden Layer
    const hidden = new Array(this.hiddenSize).fill(0);
    for (let j = 0; j < this.hiddenSize; j++) {
      let sum = this.b1[j];
      for (let i = 0; i < this.inputSize; i++) {
        sum += inputs[i] * this.W1[i][j];
      }
      // ReLU
      hidden[j] = Math.max(0, sum);
    }

    // Output Layer (Linear)
    const output = new Array(this.outputSize).fill(0);
    for (let k = 0; k < this.outputSize; k++) {
      let sum = this.b2[k];
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += hidden[j] * this.W2[j][k];
      }
      output[k] = sum;
    }
    
    return output;
  }

  // Simplified Backprop for single sample (SGD)
  // Target is the Q-Target for the specific action taken
  train(inputs: number[], actionIndex: number, targetQ: number, learningRate: number) {
    // 1. Forward Pass (need intermediate values)
    const h_in = new Array(this.hiddenSize).fill(0);
    const h_out = new Array(this.hiddenSize).fill(0);
    
    for (let j = 0; j < this.hiddenSize; j++) {
      let sum = this.b1[j];
      for (let i = 0; i < this.inputSize; i++) {
        sum += inputs[i] * this.W1[i][j];
      }
      h_in[j] = sum;
      h_out[j] = Math.max(0, sum);
    }

    const output = new Array(this.outputSize).fill(0);
    for (let k = 0; k < this.outputSize; k++) {
      let sum = this.b2[k];
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += h_out[j] * this.W2[j][k];
      }
      output[k] = sum;
    }

    // 2. Compute Gradients
    // Loss = (output[action] - target)^2
    // dLoss/dOutput = 2 * (output - target)
    const outputError = output[actionIndex] - targetQ; // omitting factor of 2 for Learning Rate absorption

    // Backprop to W2, b2
    for (let j = 0; j < this.hiddenSize; j++) {
      // dL/dW2 = dL/dOut * dOut/dW2 = err * h_out
      const grad = outputError * h_out[j];
      this.W2[j][actionIndex] -= learningRate * grad;
    }
    this.b2[actionIndex] -= learningRate * outputError;

    // Backprop to W1, b1
    for (let j = 0; j < this.hiddenSize; j++) {
        // Derivative of ReLU is 1 if > 0 else 0
        const dRelu = h_in[j] > 0 ? 1 : 0;
        // Error at hidden node j coming from the specific action output node
        const hiddenError = outputError * this.W2[j][actionIndex] * dRelu;

        for (let i = 0; i < this.inputSize; i++) {
            const grad = hiddenError * inputs[i];
            this.W1[i][j] -= learningRate * grad;
        }
        this.b1[j] -= learningRate * hiddenError;
    }
  }

  // Clone weights from another network (Target Network update)
  copyFrom(other: SimpleNN) {
    this.W1 = other.W1.map(row => [...row]);
    this.b1 = [...other.b1];
    this.W2 = other.W2.map(row => [...row]);
    this.b2 = [...other.b2];
  }
}