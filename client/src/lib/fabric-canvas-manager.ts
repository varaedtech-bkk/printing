/*
This file (fabric-canvas-manager.ts) contains Fabric.js related code that is causing conflicts with the Konva.js editor. 
It has been temporarily commented out to resolve build errors and focus on the Konva.js implementation. 
If Fabric.js functionality is required, this file will need to be properly integrated or refactored.
*/

// import { Canvas } from 'fabric';
// import type { CanvasState } from './fabric-editor-core';

// export class FabricCanvasManager {
//   private canvas: Canvas;
//   private onStateChange: (state: CanvasState) => void;

//   constructor(canvas: Canvas, onStateChange: (state: CanvasState) => void) {
//     this.canvas = canvas;
//     this.onStateChange = onStateChange;
//     this.setupEventListeners();
//   }

//   private setupEventListeners() {
//     this.canvas.on('object:modified', this.emitStateChange);
//     this.canvas.on('object:added', this.emitStateChange);
//     this.canvas.on('object:removed', this.emitStateChange);
//     this.canvas.on('selection:updated', this.emitStateChange);
//     this.canvas.on('selection:created', this.emitStateChange);
//     this.canvas.on('selection:cleared', this.emitStateChange);
//   }

//   private emitStateChange = () => {
//     this.onStateChange(this.getCurrentState());
//   };

//   getCurrentState(): CanvasState {
//     return {
//       objects: this.canvas.getObjects().map(obj => obj.toObject()),
//       // Add other relevant canvas properties if needed
//     };
//   }

//   loadState(state: CanvasState) {
//     this.canvas.loadFromJSON(state, () => {
//       this.canvas.renderAll();
//       this.emitStateChange();
//     });
//   }

//   clearCanvas() {
//     this.canvas.clear();
//     this.emitStateChange();
//   }

//   getCanvas(): Canvas {
//     return this.canvas;
//   }
// }
