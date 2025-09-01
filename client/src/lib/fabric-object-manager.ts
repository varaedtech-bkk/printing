/*
This file (fabric-object-manager.ts) contains Fabric.js related code that is causing conflicts with the Konva.js editor. 
It has been temporarily commented out to resolve build errors and focus on the Konva.js implementation. 
If Fabric.js functionality is required, this file will need to be properly integrated or refactored.
*/

// import { Canvas, IText, Rect, Circle, Triangle, Image } from 'fabric';
// import type { CanvasObject } from './fabric-editor-core';

// export class FabricObjectManager {
//   private canvas: Canvas;

//   constructor(canvas: Canvas) {
//     this.canvas = canvas;
//   }

//   addText(text: string, options?: any) {
//     const textObject = new IText(text, {
//       left: 50,
//       top: 50,
//       fontFamily: 'Inter',
//       fontSize: 20,
//       fill: '#000000',
//       ...options,
//     });
//     this.canvas.add(textObject);
//     this.canvas.setActiveObject(textObject);
//     this.canvas.renderAll();
//     return textObject;
//   }

//   addImage(imageUrl: string, options?: any) {
//     Image.fromURL(imageUrl, (img) => {
//       img.set({
//         left: 50,
//         top: 50,
//         scaleX: 0.5,
//         scaleY: 0.5,
//         ...options,
//       });
//       this.canvas.add(img);
//       this.canvas.setActiveObject(img);
//       this.canvas.renderAll();
//     });
//   }

//   addShape(shapeType: 'rectangle' | 'circle' | 'triangle', options?: any) {
//     let shape;
//     switch (shapeType) {
//       case 'rectangle':
//         shape = new Rect({
//           left: 50,
//           top: 50,
//           width: 100,
//           height: 100,
//           fill: '#FF0000',
//           ...options,
//         });
//         break;
//       case 'circle':
//         shape = new Circle({
//           left: 50,
//           top: 50,
//           radius: 50,
//           fill: '#0000FF',
//           ...options,
//         });
//         break;
//       case 'triangle':
//         shape = new Triangle({
//           left: 50,
//           top: 50,
//           width: 100,
//           height: 100,
//           fill: '#00FF00',
//           ...options,
//         });
//         break;
//       default:
//         return;
//     }
//     this.canvas.add(shape);
//     this.canvas.setActiveObject(shape);
//     this.canvas.renderAll();
//     return shape;
//   }

//   deleteSelected() {
//     const activeObjects = this.canvas.getActiveObjects();
//     if (activeObjects) {
//       this.canvas.remove(...activeObjects);
//       this.canvas.discardActiveObject();
//       this.canvas.renderAll();
//     }
//   }

//   duplicateSelected() {
//     const activeObject = this.canvas.getActiveObject();
//     if (activeObject) {
//       activeObject.clone((clonedObj: any) => {
//         this.canvas.add(clonedObj);
//         this.canvas.setActiveObject(clonedObj);
//         this.canvas.renderAll();
//       });
//     }
//   }

//   updateObjectProperty(property: string, value: any) {
//     const activeObject = this.canvas.getActiveObject();
//     if (activeObject) {
//       activeObject.set(property as any, value);
//       this.canvas.renderAll();
//     }
//   }

//   getSelectedObject(): CanvasObject | null {
//     const activeObject = this.canvas.getActiveObject();
//     return activeObject ? activeObject.toObject() as CanvasObject : null;
//   }

//   alignObjects(alignment: string) {
//     // Implement alignment logic using Fabric.js methods
//     console.log('Aligning objects:', alignment);
//   }
// }
