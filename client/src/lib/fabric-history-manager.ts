/*
This file (fabric-history-manager.ts) contains Fabric.js related code that is causing conflicts with the Konva.js editor. 
It has been temporarily commented out to resolve build errors and focus on the Konva.js implementation. 
If Fabric.js functionality is required, this file will need to be properly integrated or refactored.
*/

// import { Canvas } from 'fabric';
// import type { CanvasState } from './fabric-editor-core';

// interface HistoryState {
//   canvasState: CanvasState;
//   timestamp: number;
// }

// export class FabricHistoryManager {
//   private canvas: Canvas;
//   private history: HistoryState[] = [];
//   private currentStateIndex: number = -1;
//   private maxHistorySize: number = 20;

//   constructor(canvas: Canvas) {
//     this.canvas = canvas;
//     this.saveState(); // Save initial state
//   }

//   private getCurrentState(): CanvasState {
//     return {
//       objects: this.canvas.getObjects().map(obj => obj.toObject()),
//     };
//   }

//   saveState() {
//     const currentState = this.getCurrentState();
//     if (this.currentStateIndex < this.history.length - 1) {
//       this.history = this.history.slice(0, this.currentStateIndex + 1);
//     }
//     this.history.push({ canvasState: currentState, timestamp: Date.now() });
//     if (this.history.length > this.maxHistorySize) {
//       this.history.shift(); // Remove oldest state
//     }
//     this.currentStateIndex = this.history.length - 1;
//   }

//   undo(): boolean {
//     if (this.canUndo()) {
//       this.currentStateIndex--;
//       this.applyState(this.history[this.currentStateIndex].canvasState);
//       return true;
//     }
//     return false;
//   }

//   redo(): boolean {
//     if (this.canRedo()) {
//       this.currentStateIndex++;
//       this.applyState(this.history[this.currentStateIndex].canvasState);
//       return true;
//     }
//     return false;
//   }

//   canUndo(): boolean {
//     return this.currentStateIndex > 0;
//   }

//   canRedo(): boolean {
//     return this.currentStateIndex < this.history.length - 1;
//   }

//   private applyState(state: CanvasState) {
//     this.canvas.loadFromJSON(state, () => {
//       this.canvas.renderAll();
//     });
//   }

//   clearHistory() {
//     this.history = [];
//     this.currentStateIndex = -1;
//     this.saveState(); // Save current (cleared) state
//   }
// }
