import { Canvas, IText, Rect, Group } from 'fabric';

export class FabricEditorCore {
  private canvas: Canvas | null = null;

  // Initialize canvas with specified dimensions
  initializeCanvas(width: number, height: number): boolean {
    try {
      console.log('🎨 Initializing canvas:', width + 'x' + height);
      
      // Get the canvas element
      const canvasElement = document.getElementById('design-canvas') as HTMLCanvasElement;
      if (!canvasElement) {
        console.error('Canvas element not found');
        return false;
      }

      // Set canvas dimensions
      canvasElement.width = width;
      canvasElement.height = height;

      // Create new Fabric.js canvas
      this.canvas = new Canvas(canvasElement, {
        width,
        height,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        interactive: true,
        allowTouchScrolling: true,
      });

      // Force initial render
      this.canvas.requestRenderAll();
      this.canvas.renderAll();

      console.log('✅ Canvas initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Canvas initialization failed:', error);
      return false;
    }
  }

  // Add text to canvas
  addText(text: string, options: { x?: number; y?: number; fontSize?: number; fill?: string } = {}): boolean {
    if (!this.canvas) {
      console.error("Canvas not initialized");
      return false;
    }

    try {
      const textObject = new IText(text, {
        left: options.x || 100,
        top: options.y || 100,
        fontSize: options.fontSize || 24,
        fill: options.fill || '#FF0000',
        stroke: '#000000',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        editable: true,
        visible: true,
        opacity: 1,
      });

      this.canvas.add(textObject);
      this.canvas.setActiveObject(textObject);
      this.canvas.requestRenderAll();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to add text:', error);
      return false;
    }
  }

  // Add shape to canvas
  addShape(shapeType: "rectangle" | "circle" | "triangle", options: { x?: number; y?: number; width?: number; height?: number; radius?: number } = {}): boolean {
    if (!this.canvas) {
      console.error("Canvas not initialized");
      return false;
    }

    try {
      let shape: any;
      
      if (shapeType === 'rectangle') {
        shape = new Rect({
          left: options.x || 200,
          top: options.y || 200,
          width: options.width || 100,
          height: options.height || 80,
          fill: '#00FF00',
          stroke: '#000000',
          strokeWidth: 2,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
          lockScalingX: false,
          lockScalingY: false,
          lockRotation: false,
          visible: true,
          opacity: 1,
        });
      }

      if (shape) {
        this.canvas.add(shape);
        this.canvas.requestRenderAll();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to add shape:', error);
      return false;
    }
  }

  // Clear canvas
  clearCanvas(): void {
    if (this.canvas) {
      this.canvas.clear();
      this.canvas.requestRenderAll();
    }
  }

  // Resize canvas
  resizeCanvas(width: number, height: number): boolean {
    if (!this.canvas) {
      console.error("Canvas not initialized");
      return false;
    }

    try {
      const canvasElement = this.canvas.getElement();
      if (canvasElement) {
        canvasElement.width = width;
        canvasElement.height = height;
      }
      
      this.canvas.setDimensions({ width, height });
      this.canvas.requestRenderAll();
      
      return true;
    } catch (error) {
      console.error('❌ Canvas resize failed:', error);
      return false;
    }
  }

  // Get canvas dimensions
  getCanvasDimensions(): { width: number; height: number } {
    if (this.canvas) {
      return {
        width: this.canvas.width || 0,
        height: this.canvas.height || 0
      };
    }
    return { width: 0, height: 0 };
  }

  // Force object interactivity
  forceObjectInteractivity(): void {
    if (!this.canvas) {
      console.error("Canvas not initialized");
      return;
    }

    console.log('🔧 FORCE OBJECT INTERACTIVITY: Making objects movable and selectable...');
    
    const objects = this.canvas.getObjects();
    console.log('🔍 Objects to make interactive:', objects.length);
    
    objects.forEach((obj, index) => {
      console.log(`🔧 Making object ${index} interactive:`, obj.type);
      
      obj.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        visible: true,
        opacity: 1,
      });
      
      if (obj.type === 'i-text') {
        (obj as any).editable = true;
      }
      
      obj.dirty = true;
      obj.setCoords();
    });
    
    this.canvas.selection = true;
    this.canvas.requestRenderAll();
    this.canvas.renderAll();
    
    console.log('✅ Object interactivity forced');
  }

  // Nuclear interactivity fix
  nuclearInteractivityFix(): void {
    if (!this.canvas) {
      console.error("Canvas not initialized");
      return;
    }

    console.log('☢️ NUCLEAR INTERACTIVITY FIX: Complete object rebuild for interactivity...');
    
    const objects = this.canvas.getObjects();
    this.canvas.clear();
    
    objects.forEach((obj, index) => {
      if (obj.type === 'i-text') {
        const newText = new IText((obj as any).text, {
          left: obj.left,
          top: obj.top,
          fontSize: (obj as any).fontSize || 24,
          fill: '#FF0000',
          stroke: '#000000',
          strokeWidth: 2,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
          lockScalingX: false,
          lockScalingY: false,
          lockRotation: false,
          visible: true,
          opacity: 1,
          editable: true,
        });
        
        this.canvas!.add(newText);
      }
    });
    
    this.canvas.selection = true;
    this.canvas.requestRenderAll();
    this.canvas.renderAll();
    
    console.log('✅ Nuclear interactivity fix complete');
  }

  // Final test method
  finalTest(): void {
    if (!this.canvas) {
      console.error("Canvas not initialized");
      return;
    }

    console.log('🧪 FINAL TEST: Creating test object and verifying interactivity...');
    
    const testText = new IText('TEST INTERACTIVE', {
      left: 150,
      top: 150,
      fontSize: 20,
      fill: '#0000FF',
      stroke: '#000000',
      strokeWidth: 2,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockMovementX: false,
      lockMovementY: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      visible: true,
      opacity: 1,
      editable: true,
    });
    
    this.canvas.add(testText);
    this.canvas.setActiveObject(testText);
    this.canvas.requestRenderAll();
    
    console.log('🧪 Final test complete. Try clicking and dragging the blue "TEST INTERACTIVE" text!');
  }

  // Cleanup
  dispose() {
    if (this.canvas) {
      try {
        this.canvas.dispose();
      } catch (error) {
        console.warn('⚠️ Error during canvas disposal:', error);
      }
      this.canvas = null;
    }
  }
}
