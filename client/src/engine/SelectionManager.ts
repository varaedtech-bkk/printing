// src/engine/SelectionManager.ts
import Konva from "konva";

export type TextNodeState = {
  id: string;
  textNode: Konva.Text;
  div: HTMLDivElement;
  editing: boolean;
};

export type ImageNodeState = {
  id: string;
  imageNode: Konva.Image;
  editing: boolean;
};

export type ShapeNodeState = {
  id: string;
  shapeNode: Konva.Shape;
  editing: boolean;
};

export class SelectionManager {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private transformer: Konva.Transformer;
  private overlay: HTMLDivElement;
  private zoom = 1;
  private selectedId: string | null = null;
  private texts = new Map<string, TextNodeState>();
  private images = new Map<string, ImageNodeState>();
  private shapes = new Map<string, ShapeNodeState>();
  private _lastSelectedElementData: any = null;
  private _textEditTimeout: NodeJS.Timeout | null = null;
  private snapToGridEnabled = false;
  private gridSize = 20;

  // History management
  private history: any[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

  // Template management
  private currentTemplate: any = null;

  constructor(stage: Konva.Stage, layer: Konva.Layer, overlay: HTMLDivElement) {
    this.stage = stage;
    this.layer = layer;
    this.overlay = overlay;

    // Create transformer
    this.transformer = new Konva.Transformer({
      rotateEnabled: true,
      keepRatio: false, // Allow free resizing for images
      enabledAnchors: [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "middle-left",
        "middle-right",
        "top-center",
        "bottom-center",
      ],
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < 20) newBox.width = 20;
        if (newBox.height < 20) newBox.height = 20;
        return newBox;
      },
      // Make sure transformer is visible and interactive
      listening: true,
      visible: true,
      // Prevent transformer errors
      ignoreStroke: false,
      useSingleNodeRotation: true,
      shouldOverdrawWholeArea: false,
    });
    this.layer.add(this.transformer);
  }

  setZoom(z: number) {
    this.zoom = z;
    this.syncKonvaToHtml();
  }

  /** Create a text element */
  addText(
    text: string,
    x: number,
    y: number,
    width = 200,
    font = "Inter",
    fontSize = 32
  ) {
    // Validate stage and layer are initialized
    if (!this.stage || !this.layer) {
      console.warn('⚠️ SelectionManager: Stage or layer not initialized, cannot add text');
      return null;
    }

    // Validate stage has valid dimensions
    if (this.stage.width() <= 0 || this.stage.height() <= 0) {
      console.warn('⚠️ SelectionManager: Stage has invalid dimensions, cannot add text');
      return null;
    }

    const id = `txt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Create Konva Text node
    const textNode = new Konva.Text({
      x: x,
      y: y,
      text: text, // Use the provided text parameter
      fontSize: fontSize,
      fontFamily: font,
      fill: "#000000",
      width: width,
      height: fontSize * 1.2,
      draggable: true,
      name: id,
      id: id,
      rotation: 0,
      align: "center",
      listening: true,
    });
    // Add to layer safely
    this.layer.add(textNode);

    // Force a draw to ensure the text is properly rendered
    try {
      // Only draw if the stage has valid dimensions
      if (this.stage && this.stage.width() > 0 && this.stage.height() > 0) {
        this.layer.draw();
      } else {
        console.warn("⚠️ Text layer draw skipped: invalid stage dimensions");
      }
    } catch (error) {
      console.warn("⚠️ Text layer draw error:", error);
    }

    // Create HTML overlay div
    const div = document.createElement("div");
    div.className = "text-div";
    div.dataset.id = id;
    div.contentEditable = "false";
    div.style.position = "absolute";
    div.style.fontFamily = font;
    div.style.fontSize = `${fontSize}px`; // Match Konva font size
    div.style.lineHeight = "1.2";
    div.style.pointerEvents = "none";
    div.style.color = "#000000";
    div.style.textAlign = "center";
    div.style.fontWeight = "normal";
    div.style.fontStyle = "normal";
    div.style.textDecoration = "none";
    div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    div.style.border = "1px solid transparent";
    div.style.borderRadius = "4px";
    div.style.outline = "none";
    div.style.padding = "2px 4px";
    div.style.margin = "0";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.overflow = "hidden";
    div.style.cursor = "text";
    div.style.transition = "all 0.2s ease";
    div.style.boxSizing = "border-box";
    div.style.transformOrigin = "0 0";
    div.style.opacity = "0";
    div.innerText = text; // Use the provided text parameter
    this.overlay.appendChild(div);

    const state: TextNodeState = { id, textNode, div, editing: false };
    this.texts.set(id, state);

    // Event handlers
    textNode.on("dblclick dbltap", () => this.enterEdit(id));
    textNode.on("transform", () => this.syncKonvaToHtml());
    textNode.on("dragmove", () => this.syncKonvaToHtml());
    textNode.on("dragend", () => this.syncKonvaToHtml());

    div.addEventListener("click", (e) => {
      e.stopPropagation();
      this.select(textNode);
    });
    
    div.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.enterEdit(id);
    });

    // Hover effects
    div.addEventListener("mouseenter", () => {
      const currentState = this.texts.get(id);
      if (currentState && !currentState.editing) {
        div.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        div.style.border = "1px solid rgba(75, 156, 255, 0.5)";
      }
    });

    div.addEventListener("mouseleave", () => {
      const currentState = this.texts.get(id);
      if (currentState && !currentState.editing) {
        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        div.style.border = "1px solid transparent";
      }
    });

    // Only draw if the stage has valid dimensions
    try {
      if (this.stage && this.stage.width() > 0 && this.stage.height() > 0) {
        this.layer.draw();
      } else {
        console.warn("⚠️ Text layer draw skipped: invalid stage dimensions");
      }
    } catch (error) {
      console.warn("⚠️ Text layer draw error:", error);
    }

    // Sync HTML overlay safely
    try {
      this.syncKonvaToHtml();
    } catch (error) {
      console.warn("⚠️ HTML sync error:", error);
    }

    return textNode;
  }

  select(node: Konva.Node | null) {
    console.log(
      "🎯 SelectionManager.select called with node:",
      node?.name(),
      node?.getType()
    );
    if (!node) {
      console.log("🎯 Clearing selection");
      this.transformer.nodes([]);
      this.clearHtmlSelection();
      this.selectedId = null;
      this._lastSelectedElementData = null;
      return;
    }

    const id = node.name();
    console.log("🎯 Selecting node with id:", id, "type:", node.getType());

    // Clear previous selection
    this.transformer.nodes([]);

    // Select the new node
    try {
      this.transformer.nodes([node]);
      // Bring transformer to front only if it's attached to a layer
      if (this.transformer.getLayer()) {
        this.transformer.moveToTop();
      }
      // Force redraw
      this.layer.draw();
    } catch (error) {
      console.error("❌ Error selecting node with transformer:", error);
      // Fallback: just select without transformer
      this.selectedId = id;
      this.layer.draw();
    }

    this.clearHtmlSelection();
    const st = id && this.texts.get(id);
    const img = id && this.images.get(id);

    if (st) {
      st.div.classList.add("selected");
      this.selectedId = id;
      console.log("🎯 Text element selected:", id);
    } else if (img) {
      this.selectedId = id;
      console.log("🎯 Image element selected:", id);
      console.log("🎯 Image details:", { id: img.id, hasImageNode: !!img.imageNode });
      console.log("🎯 Image node exists:", !!img.imageNode);
      if (img.imageNode) {
        console.log("🎯 Image node type:", img.imageNode.getType());
        console.log("🎯 Image node position:", img.imageNode.position());
      }
    } else {
      // Handle other nodes
      this.selectedId = id;
      console.log("🎯 Other element selected:", id, node.getType());
    }
  }

  clearHtmlSelection() {
    this.overlay
      .querySelectorAll(".text-div.selected")
      .forEach((el) => el.classList.remove("selected"));
  }

  /** Sync Konva → HTML - Optimized version */
  syncKonvaToHtml() {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      // Skip if no text elements exist
      if (this.texts.size === 0) {
        return;
      }

      for (const [id, st] of this.texts.entries()) {
        if (!st.textNode) {
          console.warn(
            `⚠️ syncKonvaToHtml: textNode is undefined for text element ${id}`
          );
          continue;
        }

        try {
          const textNode = st.textNode;
          const div = st.div;

          // Cache frequently accessed values to reduce DOM queries
          const x = textNode.x();
          const y = textNode.y();
          const rotation = textNode.rotation();
          const scaleX = textNode.scaleX();
          const scaleY = textNode.scaleY();
          const textWidth = textNode.width();
          const textHeight = textNode.height();
          const fontSize = textNode.fontSize();
          const fontFamily = textNode.fontFamily();
          const fill = textNode.fill();
          const align = textNode.align() || "center";
          const fontStyle = textNode.fontStyle();

          // Batch style updates for better performance
          const style = div.style;

          // Position text div relative to the HTML overlay container
          // Ensure positioning is precise and accounts for any container offset
          const preciseX = Math.round(x * this.zoom * 100) / 100;
          const preciseY = Math.round(y * this.zoom * 100) / 100;
          style.left = `${preciseX}px`;
          style.top = `${preciseY}px`;
          style.width = `${textWidth * this.zoom}px`;
          style.height = `${textHeight * this.zoom}px`;
          style.transformOrigin = "0 0";
          style.transform = `rotate(${rotation}deg) scale(${scaleX * this.zoom}, ${scaleY * this.zoom})`;
          // Scale font size with zoom
          style.fontSize = `${fontSize * this.zoom}px`;
          style.textAlign = align;
          style.fontFamily = fontFamily;
          style.color = fill;
          style.fontWeight = fontStyle.includes("bold") ? "bold" : "normal";
          style.fontStyle = fontStyle.includes("italic") ? "italic" : "normal";
          // Only show HTML overlay when text is selected or being edited
          const isSelected = this.selectedId === id;
          const isEditing = st.editing;

          if (isSelected || isEditing) {
            style.opacity = "1";
            style.pointerEvents = "auto";
            // Show subtle background when selected but not editing
            if (isSelected && !isEditing) {
              style.backgroundColor = "rgba(59, 130, 246, 0.1)";
              style.border = "1px solid rgba(59, 130, 246, 0.3)";
            }
          } else {
            style.opacity = "0";
            style.pointerEvents = "none";
            style.backgroundColor = "transparent";
            style.border = "1px solid transparent";
          }
        } catch (error) {
          console.error("❌ syncKonvaToHtml error:", error);
        }
      }
    });
  }

  /** Sync HTML → Konva - Optimized version */
  syncHtmlToKonva() {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      let needsDraw = false;

      for (const st of this.texts.values()) {
        if (!st.textNode) {
          console.warn(
            "⚠️ syncHtmlToKonva: textNode is undefined for text element"
          );
          continue;
        }

        // Check if text node is still attached to layer
        if (!st.textNode.getLayer()) {
          console.warn("⚠️ syncHtmlToKonva: Text node not attached to layer");
          continue;
        }

        try {
          const currentWidth = st.div.scrollWidth;
          const currentHeight = st.div.scrollHeight;

          if (currentWidth > 0 && currentHeight > 0) {
            // Only update if dimensions are reasonable and have changed
            if (currentWidth < 2000 && currentHeight < 2000) {
              const currentNodeWidth = st.textNode.width();
              const currentNodeHeight = st.textNode.height();

              // Only update if dimensions actually changed
              if (Math.abs(currentNodeWidth - currentWidth) > 1 || Math.abs(currentNodeHeight - currentHeight) > 1) {
                st.textNode.width(currentWidth);
                st.textNode.height(currentHeight);
                needsDraw = true;
              }
            } else {
              console.warn("⚠️ syncHtmlToKonva: Unreasonable dimensions:", currentWidth, currentHeight);
            }
          }
        } catch (error) {
          console.error("❌ syncHtmlToKonva error:", error);
        }
      }

      // Only call batchDraw if something actually changed
      if (needsDraw) {
        try {
          this.layer.batchDraw();
        } catch (drawError) {
          console.warn("⚠️ syncHtmlToKonva batchDraw error:", drawError);
        }
      }
    });
  }

  enterEdit(id: string) {
    const st = this.texts.get(id);
    if (!st || !st.textNode) {
      console.warn(
        "⚠️ enterEdit: Text element or textNode not found for id:",
        id
      );
      return;
    }

    try {
      st.textNode.listening(false);
      this.transformer.nodes([]);
    this.layer.draw();

      st.div.classList.add("selected");
      st.div.contentEditable = "true";
      st.div.style.pointerEvents = "auto";
      st.div.style.backgroundColor = "rgba(255, 255, 255, 0.98)";
      st.div.style.border = "2px solid #007bff";
      st.div.style.borderRadius = "4px";
      st.div.style.padding = "4px 6px";
      st.div.style.zIndex = "1000";
      st.div.style.boxShadow =
        "0 0 0 2px rgba(0, 123, 255, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15)";
      st.div.style.opacity = "1";
      st.textNode.opacity(0.1);
    st.div.focus();

    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(st.div);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);

    st.editing = true;

    const onBlur = () => {
      // Clear any existing timeout
      if (this._textEditTimeout) {
        clearTimeout(this._textEditTimeout);
      }

      // Throttle the exit edit call
      this._textEditTimeout = setTimeout(() => {
        st.div.removeEventListener("blur", onBlur);
        this.exitEdit(id);
        this._textEditTimeout = null;
      }, 100); // 100ms delay to prevent excessive calls
    };
      st.div.addEventListener("blur", onBlur);

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        st.div.blur();
      }
    };
      st.div.addEventListener("keydown", onKeyDown);
    } catch (error) {
      console.error("❌ enterEdit error:", error);
    }
  }

  exitEdit(id: string) {
    const st = this.texts.get(id);
    if (!st || !st.textNode) {
      console.warn(
        "⚠️ exitEdit: Text element or textNode not found for id:",
        id
      );
      return;
    }

    try {
      // Check if text node is still attached to layer
      if (!st.textNode.getLayer()) {
        console.warn("⚠️ exitEdit: Text node not attached to layer");
        return;
      }

      st.div.contentEditable = "false";
      st.div.style.pointerEvents = "none";
      st.div.style.backgroundColor = "transparent";
      st.div.style.border = "none";
      st.div.style.padding = "0";
      st.div.style.zIndex = "auto";
      st.div.style.opacity = "0";
      st.textNode.opacity(1);
      st.textNode.listening(true);
      st.editing = false;

      // Update Konva text with content from HTML div
      const newText = st.div.innerText?.trim() || '';
      if (newText && newText !== "Click to edit text") {
        try {
          st.textNode.text(newText);
        } catch (textError) {
          console.warn("⚠️ Text update error in exitEdit:", textError);
        }

        // Update size to fit new content
        try {
          this.syncHtmlToKonva();
        } catch (syncError) {
          console.warn("⚠️ syncHtmlToKonva error in exitEdit:", syncError);
        }
      }

      this.layer.draw();

      try {
        this.stage.fire("click", { target: st.textNode, evt: null });
      } catch (fireError) {
        console.warn("⚠️ stage.fire error in exitEdit:", fireError);
      }

      try {
        this.syncKonvaToHtml();
      } catch (syncError) {
        console.warn("⚠️ syncKonvaToHtml error in exitEdit:", syncError);
      }
    } catch (error) {
      console.error("❌ exitEdit error:", error);
    }
  }

  /** Add image to canvas */
  async addImageFromUrl(url: string, x = 50, y = 50) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => resolve(im);
        im.onerror = (e) =>
          reject(new Error(`Failed to load image from ${url}: ${e}`));
        im.src = url;
      });

      const generatedId = `img_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      const ki = new Konva.Image({
        image: img,
        x,
        y,
        width: Math.min(img.width, 300), // Limit initial size for better UX
        height: Math.min(img.height, 300),
        draggable: true,
        listening: true,
        name: generatedId,
        id: generatedId,
        // Ensure image is transformable
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        skewX: 0,
        skewY: 0,
        offsetX: 0,
        offsetY: 0,
      });

      // Set up event handlers for the image
      ki.on("transform", () => {
        // Update image dimensions after transformation
        const scaleX = ki.scaleX();
        const scaleY = ki.scaleY();
        ki.width(ki.width() * scaleX);
        ki.height(ki.height() * scaleY);
        ki.scaleX(1);
        ki.scaleY(1);
        this.layer.batchDraw();
      });
      ki.on("dragmove", () => this.layer.batchDraw());
      ki.on("transformstart", () => {
        console.log("🖼️ Image transform started");
      });
      ki.on("transformend", () => {
        console.log("🖼️ Image transform ended");
        this.saveState();
      });

      // Add click handler to select the image
      ki.on("click", (e) => {
        console.log("🖼️ Image clicked:", generatedId);
        e.cancelBubble = true;
        this.select(ki);
      });

      // Add to the images map so it can be managed like other elements
      console.log("🖼️ Adding image to images map:", generatedId);
      this.images.set(generatedId, {
        id: generatedId,
        imageNode: ki,
        editing: false,
      });
      console.log("🖼️ Images map size after adding:", this.images.size);

      this.layer.add(ki);
      this.layer.draw();

      // Select the newly added image
      console.log("🖼️ Selecting newly added image");
      this.select(ki);
      console.log("🖼️ Image added to canvas:", generatedId, "size:", img.width, "x", img.height);
    } catch (error) {
      console.error("❌ Error adding image:", error);
    }
  }

  /** Add shape to canvas */
  addShape(
    shapeType: "rectangle" | "circle" | "ellipse" | "triangle",
    x: number,
    y: number
  ) {
    let shape: Konva.Shape;
    const generatedId = `${shapeType}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    
    switch (shapeType) {
      case "rectangle":
        shape = new Konva.Rect({
          x,
          y,
          width: 100,
          height: 80,
          fill: "#3B82F6",
          stroke: "#1E40AF",
          strokeWidth: 2,
          draggable: true,
          name: generatedId,
          id: generatedId,
        });
        break;
        
      case "circle":
        shape = new Konva.Circle({
          x: x + 50,
          y: y + 50,
          radius: 50,
          fill: "#8B5CF6",
          stroke: "#6D28D9",
          strokeWidth: 2,
          draggable: true,
          name: generatedId,
          id: generatedId,
        });
        break;
        
      case "ellipse":
        shape = new Konva.Ellipse({
          x: x + 60,
          y: y + 40,
          radiusX: 60,
          radiusY: 40,
          fill: "#F97316",
          stroke: "#EA580C",
          strokeWidth: 2,
          draggable: true,
          name: generatedId,
          id: generatedId,
        });
        break;
        
      case "triangle":
        shape = new Konva.RegularPolygon({
          x: x + 50,
          y: y + 50,
          sides: 3,
          radius: 50,
          fill: "#10B981",
          stroke: "#059669",
          strokeWidth: 2,
          draggable: true,
          name: generatedId,
          id: generatedId,
        });
        break;
        
      default:
        return null;
    }
    
        // Set up event handlers
    shape.on("transform", () => {
      try {
        this.layer.batchDraw();
      } catch (error) {
        console.warn("⚠️ Transform event error:", error);
      }
    });
    shape.on("dragmove", () => {
      try {
        this.layer.batchDraw();
      } catch (error) {
        console.warn("⚠️ Drag event error:", error);
      }
    });

    // Add to layer and draw
    this.layer.add(shape);

    // Force a draw to ensure the shape is properly rendered
    try {
      this.layer.draw();
    } catch (error) {
      console.warn("⚠️ Layer draw error:", error);
    }

    // Select the shape after a brief delay to ensure it's fully initialized
    setTimeout(() => {
      try {
        this.stage.fire("click", { target: shape, evt: null });
      } catch (error) {
        console.warn("⚠️ Shape selection error:", error);
      }
    }, 10);

    return shape;
  }

  // Properties Panel Methods
  getSelectedElementData() {
    console.log("📋 getSelectedElementData called, selectedId:", this.selectedId);
    if (!this.selectedId) {
      console.log("📋 No selectedId, returning null");
      return null;
    }

    // Handle text elements
    const st = this.texts.get(this.selectedId);
    if (st && st.textNode) {
      try {
        const { x, y } = st.textNode.position();
        const { width, height } = st.textNode.getClientRect();

        return {
          id: st.id,
          type: "text",
          position: { x, y },
          size: { width, height },
          content: st.div.innerText,
          style: {
            fontFamily: st.div.style.fontFamily,
            fontSize: parseInt(st.div.style.fontSize) || 28,
            color: st.div.style.color,
            textAlign: st.div.style.textAlign,
            fontWeight: st.div.style.fontWeight,
            fontStyle: st.div.style.fontStyle,
            textDecoration: st.div.style.textDecoration,
          },
        };
      } catch (error) {
        console.error("❌ getSelectedElementData error:", error);
        return null;
      }
    } else if (st) {
      console.warn(
        "⚠️ getSelectedElementData: textNode is undefined for selected text element"
      );
    }

    // Handle image elements
    console.log("📋 Checking for image element, selectedId:", this.selectedId);
    const img = this.images.get(this.selectedId);
    console.log("📋 Image found in map:", !!img);
    console.log("📋 Image has imageNode:", !!img?.imageNode);
    if (img && img.imageNode) {
      console.log("📋 Processing image element data");
      try {
        const { x, y } = img.imageNode.position();
        const { width, height } = img.imageNode.getClientRect();
        const rotation = img.imageNode.rotation();
        const scaleX = img.imageNode.scaleX();
        const scaleY = img.imageNode.scaleY();

        const imageData = {
          id: img.id,
          type: "image",
          position: { x, y },
          size: { width, height },
          rotation: rotation,
          scale: { x: scaleX, y: scaleY },
          style: {
            opacity: img.imageNode.opacity(),
            visible: img.imageNode.visible(),
            src: img.imageNode.image() instanceof HTMLImageElement
              ? (img.imageNode.image() as HTMLImageElement).src
              : undefined,
          },
        };
        console.log("📋 Returning image data:", imageData);
        console.log("📋 Image data type:", typeof imageData.type, "value:", imageData.type);
        return imageData;
      } catch (error) {
        console.error("❌ getSelectedElementData error for image:", error);
        return null;
      }
    }

    // Handle shapes and other elements
    let selectedNode = this.stage.findOne(`#${this.selectedId}`);
    if (!selectedNode) {
      selectedNode = this.stage.findOne(`.${this.selectedId}`);
    }

    if (selectedNode) {
      const { x, y } = selectedNode.position();
      const { width, height } = selectedNode.getClientRect();
      const rotation = selectedNode.rotation();
      const scaleX = selectedNode.scaleX();
      const scaleY = selectedNode.scaleY();

      return {
        id: selectedNode.name(),
        type: selectedNode.getType(),
        position: { x, y },
        size: { width, height },
        rotation: rotation,
        scale: { x: scaleX, y: scaleY },
        style: {
          opacity: selectedNode.opacity(),
          visible: selectedNode.visible(),
          fill:
            selectedNode instanceof Konva.Shape
              ? (selectedNode as any).fill()
              : undefined,
          stroke:
            selectedNode instanceof Konva.Shape
              ? (selectedNode as any).stroke()
              : undefined,
          strokeWidth:
            selectedNode instanceof Konva.Shape
              ? (selectedNode as any).strokeWidth()
              : undefined,
          src:
            selectedNode instanceof Konva.Image &&
            selectedNode.image() instanceof HTMLImageElement
              ? (selectedNode.image() as HTMLImageElement).src
              : undefined,
        },
      };
    }

    return null;
  }

  // Text property updates
  updateFontSize(size: number) {
    const st = this.texts.get(this.selectedId || "");
    if (!st) return false;

    st.div.style.fontSize = `${size}px`;
    st.textNode.fontSize(size);
    this.layer.batchDraw();
    this._lastSelectedElementData = null;
    return true;
  }

  updateFontFamily(fontFamily: string) {
    const st = this.texts.get(this.selectedId || "");
    if (!st) return false;

    st.div.style.fontFamily = fontFamily;
    st.textNode.fontFamily(fontFamily);
    this.layer.batchDraw();
    this._lastSelectedElementData = null;
    return true;
  }

  updateColor(color: string) {
    const st = this.texts.get(this.selectedId || "");
    if (!st || !st.textNode) {
      console.warn(
        "⚠️ updateColor: No text element selected or textNode is undefined"
      );
      return false;
    }

    try {
    st.div.style.color = color;
      st.textNode.fill(color);
      this.syncKonvaToHtml();
      this.layer.batchDraw();
      this._lastSelectedElementData = null;
    return true;
    } catch (error) {
      console.error("❌ updateColor error:", error);
      return false;
    }
  }

  updateTextAlign(align: "left" | "center" | "right" | "justify") {
    const st = this.texts.get(this.selectedId || "");
    if (!st || !st.textNode) {
      console.warn(
        "⚠️ updateTextAlign: No text element selected or textNode is undefined"
      );
      return false;
    }

    try {
    st.div.style.textAlign = align;
      st.textNode.align(align);
      this.syncKonvaToHtml();
      this.layer.batchDraw();
      this._lastSelectedElementData = null;
    return true;
    } catch (error) {
      console.error("❌ updateTextAlign error:", error);
      return false;
    }
  }

  updateFontWeight(weight: "normal" | "bold") {
    const st = this.texts.get(this.selectedId || "");
    if (!st || !st.textNode) {
      console.warn(
        "⚠️ updateFontWeight: No text element selected or textNode is undefined"
      );
      return false;
    }

    try {
    st.div.style.fontWeight = weight;
      const isItalic = st.textNode.fontStyle().includes("italic");
      st.textNode.fontStyle(
        weight === "bold"
          ? isItalic
            ? "bold italic"
            : "bold"
          : isItalic
          ? "italic"
          : "normal"
      );
      this.syncKonvaToHtml();
      this.layer.batchDraw();
      this._lastSelectedElementData = null;
    return true;
    } catch (error) {
      console.error("❌ updateFontWeight error:", error);
      return false;
    }
  }

  updateFontStyle(style: "normal" | "italic") {
    const st = this.texts.get(this.selectedId || "");
    if (!st || !st.textNode) {
      console.warn(
        "⚠️ updateFontStyle: No text element selected or textNode is undefined"
      );
      return false;
    }

    try {
    st.div.style.fontStyle = style;
      const isBold = st.textNode.fontStyle().includes("bold");
      st.textNode.fontStyle(
        style === "italic"
          ? isBold
            ? "bold italic"
            : "italic"
          : isBold
          ? "bold"
          : "normal"
      );
      this.syncKonvaToHtml();
      this.layer.batchDraw();
      this._lastSelectedElementData = null;
    return true;
    } catch (error) {
      console.error("❌ updateFontStyle error:", error);
      return false;
    }
  }

  updateTextDecoration(decoration: "none" | "underline" | "line-through") {
    const st = this.texts.get(this.selectedId || "");
    if (!st || !st.textNode) {
      console.warn(
        "⚠️ updateTextDecoration: No text element selected or textNode is undefined"
      );
      return false;
    }

    try {
    st.div.style.textDecoration = decoration;
      st.textNode.setAttr("textDecoration", decoration);
      this.syncKonvaToHtml();
      this.layer.batchDraw();
      this._lastSelectedElementData = null;
    return true;
    } catch (error) {
      console.error("❌ updateTextDecoration error:", error);
      return false;
    }
  }

  updateTextContent(text: string) {
    const st = this.texts.get(this.selectedId || "");
    if (!st || !st.textNode) {
      console.warn(
        "⚠️ updateTextContent: No text element selected or textNode is undefined"
      );
      return false;
    }

    try {
      // Update both HTML div and Konva text node with the new content
    st.div.innerText = text;
      st.textNode.text(text);

      // Update the text node size to fit the new content
      const textWidth = st.div.scrollWidth;
      const textHeight = st.div.scrollHeight;
      if (textWidth > 0 && textHeight > 0) {
        st.textNode.width(textWidth);
        st.textNode.height(textHeight);
      }

      this.syncKonvaToHtml();
      this.layer.batchDraw();
      this._lastSelectedElementData = null;
    return true;
    } catch (error) {
      console.error("❌ updateTextContent error:", error);
      return false;
    }
  }

  // Shape property updates
  updateShapeFillColor(fillColor: string) {
    try {
      let selectedNode = this.stage.findOne(`#${this.selectedId}`);
      if (!selectedNode)
        selectedNode = this.stage.findOne(`.${this.selectedId}`);

      if (
        selectedNode &&
        selectedNode instanceof Konva.Shape &&
        !(selectedNode instanceof Konva.Text)
      ) {
        (selectedNode as any).fill(fillColor);
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        return true;
      }
      console.warn("⚠️ updateShapeFillColor: No valid shape selected");
      return false;
    } catch (error) {
      console.error("❌ updateShapeFillColor error:", error);
      return false;
    }
  }

  updateShapeStrokeColor(strokeColor: string) {
    try {
      let selectedNode = this.stage.findOne(`#${this.selectedId}`);
      if (!selectedNode)
        selectedNode = this.stage.findOne(`.${this.selectedId}`);

      if (
        selectedNode &&
        selectedNode instanceof Konva.Shape &&
        !(selectedNode instanceof Konva.Text)
      ) {
        (selectedNode as any).stroke(strokeColor);
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        return true;
      }
      console.warn("⚠️ updateShapeStrokeColor: No valid shape selected");
      return false;
    } catch (error) {
      console.error("❌ updateShapeStrokeColor error:", error);
      return false;
    }
  }

  updateShapeStrokeWidth(strokeWidth: number) {
    try {
      let selectedNode = this.stage.findOne(`#${this.selectedId}`);
      if (!selectedNode)
        selectedNode = this.stage.findOne(`.${this.selectedId}`);

      if (
        selectedNode &&
        selectedNode instanceof Konva.Shape &&
        !(selectedNode instanceof Konva.Text)
      ) {
        (selectedNode as any).strokeWidth(strokeWidth);
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        return true;
      }
      console.warn("⚠️ updateShapeStrokeWidth: No valid shape selected");
      return false;
    } catch (error) {
      console.error("❌ updateShapeStrokeWidth error:", error);
      return false;
    }
  }

  updatePosition(x: number, y: number) {
    try {
      // Handle text nodes
      const st = this.texts.get(this.selectedId || "");
      if (st && st.textNode) {
        st.textNode.position({ x, y });
        this.syncKonvaToHtml();
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        return true;
      }

      // Handle image nodes
      const img = this.images.get(this.selectedId || "");
      if (img && img.imageNode) {
        img.imageNode.position({ x, y });
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        return true;
      }

      // Handle shapes and other elements
      let selectedNode = this.stage.findOne(`#${this.selectedId}`);
      if (!selectedNode)
        selectedNode = this.stage.findOne(`.${this.selectedId}`);

      if (selectedNode) {
        selectedNode.x(x);
        selectedNode.y(y);
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        return true;
      }

      console.warn("⚠️ updatePosition: No valid element selected");
      return false;
    } catch (error) {
      console.error("❌ updatePosition error:", error);
      return false;
    }
  }

  // Utility methods
  canPerformOperations() {
    return this.selectedId !== null;
  }

  forceRefreshCanvasState() {
    this.syncKonvaToHtml();
    this.layer.batchDraw();
  }

  refreshHtmlOverlay() {
    this.syncKonvaToHtml();
  }

  setSnapToGrid(enabled: boolean) {
    this.snapToGridEnabled = enabled;
    console.log("🔧 Snap to grid:", enabled ? "enabled" : "disabled");
  }

  private snapToGrid(value: number): number {
    if (!this.snapToGridEnabled) return value;
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  deleteSelected() {
    console.log("🗑️ deleteSelected called, selectedId:", this.selectedId);
    if (!this.selectedId) {
      console.log("❌ No selectedId, returning early");
      return;
    }

    // Handle text elements
    const st = this.texts.get(this.selectedId);
    if (st) {
      console.log("🗑️ Deleting text element:", this.selectedId);
      st.textNode.destroy();
      st.div.remove();
      this.texts.delete(this.selectedId);
    } else {
      // Handle image elements
      const img = this.images.get(this.selectedId);
      if (img) {
        console.log("🗑️ Deleting image element:", this.selectedId);
        console.log("🗑️ Image node exists:", !!img.imageNode);
        img.imageNode.destroy();
        this.images.delete(this.selectedId);
        console.log("✅ Image deleted from map");
      } else {
        console.log("🔍 Image not found in images map, trying other selectors...");
        // Handle shapes and other elements - try both id and name selectors
        let node = this.stage.findOne(`#${this.selectedId}`);
        if (!node) {
          node = this.stage.findOne(`.${this.selectedId}`);
        }
        if (node) {
          console.log("🗑️ Deleting other element:", this.selectedId, "type:", node.getType());
          node.destroy();
        } else {
          console.log("❌ No element found to delete with id:", this.selectedId);
        }
      }
    }

    // Clear selection state
    console.log("🧹 Clearing selection state");
    this.selectedId = null;
    this.transformer.nodes([]);
    this._lastSelectedElementData = null;
    this.layer.draw();
  }

  getAllTexts() {
    return Array.from(this.texts.values()).map((st) => ({
      id: st.id,
      content: st.div.innerText,
      style: {
        fontFamily: st.div.style.fontFamily,
        fontSize: parseInt(st.div.style.fontSize) || 16,
        color: st.div.style.color,
        textAlign: st.div.style.textAlign,
        fontWeight: st.div.style.fontWeight,
        fontStyle: st.div.style.fontStyle,
        textDecoration: st.div.style.textDecoration,
      },
    }));
  }

  // History management
  saveState() {
    const state = this.toJSON();
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];
      this.fromJSON(state);
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const state = this.history[this.historyIndex];
      this.fromJSON(state);
      return true;
    }
    return false;
  }

  canUndo() {
    return this.historyIndex > 0;
  }

  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  toJSON() {
    const texts = Array.from(this.texts.values())
      .filter((st) => st.textNode) // Only include text elements with valid textNode
      .map((st) => {
        try {
          return {
      id: st.id,
            position: st.textNode.position(),
            size: { width: st.textNode.width(), height: st.textNode.height() },
      content: st.div.innerText,
      style: {
        fontFamily: st.div.style.fontFamily,
        fontSize: parseInt(st.div.style.fontSize) || 28,
        color: st.div.style.color,
        textAlign: st.div.style.textAlign,
        fontWeight: st.div.style.fontWeight,
        fontStyle: st.div.style.fontStyle,
        textDecoration: st.div.style.textDecoration,
            },
          };
        } catch (error) {
          console.warn(
            "⚠️ toJSON: Error serializing text element:",
            st.id,
            error
          );
          return null;
        }
      })
      .filter((item) => item !== null); // Remove null entries

    const images = Array.from(this.images.values())
      .filter((img) => img.imageNode) // Only include image elements with valid imageNode
      .map((img) => {
        try {
          const { x, y } = img.imageNode.position();
          const { width, height } = img.imageNode.getClientRect();
          return {
            id: img.id,
            position: { x, y },
            size: { width, height },
            rotation: img.imageNode.rotation(),
            scale: { x: img.imageNode.scaleX(), y: img.imageNode.scaleY() },
            style: {
              opacity: img.imageNode.opacity(),
              visible: img.imageNode.visible(),
              src: img.imageNode.image() instanceof HTMLImageElement
                ? (img.imageNode.image() as HTMLImageElement).src
                : undefined,
            },
          };
        } catch (error) {
          console.warn(
            "⚠️ toJSON: Error serializing image element:",
            img.id,
            error
          );
          return null;
        }
      })
      .filter((item) => item !== null); // Remove null entries

    return { texts, images };
  }

  fromJSON(data: any) {
    // Clear existing elements
    this.texts.forEach((st) => {
      st.textNode.destroy();
      st.div.remove();
    });
    this.texts.clear();

    this.images.forEach((img) => {
      img.imageNode.destroy();
    });
    this.images.clear();

    // Restore text elements
    if (data.texts) {
      data.texts.forEach((textData: any) => {
        const newTextNode = this.addText(
          textData.content,
          textData.position.x,
          textData.position.y,
          textData.size.width,
          textData.style.fontFamily,
          textData.style.fontSize
        );
        if (newTextNode) {
          try {
        newTextNode.fill(textData.style.color);
        newTextNode.align(textData.style.textAlign);
            newTextNode.fontStyle(
              textData.style.fontWeight === "bold"
                ? "bold"
                : textData.style.fontStyle
            );
            newTextNode.setAttr(
              "textDecoration",
              textData.style.textDecoration
            );
            newTextNode.rotation(textData.rotation || 0);
        newTextNode.scaleX(textData.scale ? textData.scale.x : 1);
        newTextNode.scaleY(textData.scale ? textData.scale.y : 1);
          } catch (error) {
            console.error(
              "❌ fromJSON: Error applying style to text element:",
              error
            );
          }
        }
      });
    }

    // Restore image elements
    if (data.images) {
      data.images.forEach(async (imageData: any) => {
        if (imageData.style?.src) {
          try {
            await this.addImageFromUrl(
              imageData.style.src,
              imageData.position.x,
              imageData.position.y
            );
            // Apply additional properties after image is loaded
            const img = this.images.get(imageData.id);
            if (img && img.imageNode) {
              img.imageNode.opacity(imageData.style.opacity || 1);
              img.imageNode.visible(imageData.style.visible !== false);
              img.imageNode.rotation(imageData.rotation || 0);
              img.imageNode.scaleX(imageData.scale?.x || 1);
              img.imageNode.scaleY(imageData.scale?.y || 1);
            }
          } catch (error) {
            console.error(
              "❌ fromJSON: Error restoring image element:",
              imageData.id,
              error
            );
          }
        }
      });
    }

    this._lastSelectedElementData = null;
  }

  updateOpacity(opacity: number) {
    console.log("🔧 updateOpacity called with:", opacity, "selectedId:", this.selectedId);
    if (!this.selectedId) {
      console.log("❌ No selectedId for opacity update");
      return false;
    }

    // Handle image elements
    const img = this.images.get(this.selectedId);
    if (img && img.imageNode) {
      console.log("🖼️ Updating opacity for image:", this.selectedId);
      try {
        img.imageNode.opacity(opacity);
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        console.log("✅ Image opacity updated successfully");
        return true;
      } catch (error) {
        console.error("❌ updateOpacity error for image:", error);
        return false;
      }
    }

    // Handle shape elements
    let node = this.stage.findOne(`#${this.selectedId}`);
    if (!node) {
      node = this.stage.findOne(`.${this.selectedId}`);
    }
    if (node) {
      console.log("🔧 Updating opacity for shape:", this.selectedId);
      try {
        node.opacity(opacity);
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        console.log("✅ Shape opacity updated successfully");
        return true;
      } catch (error) {
        console.error("❌ updateOpacity error for shape:", error);
        return false;
      }
    }

    console.log("❌ No element found to update opacity for:", this.selectedId);
    return false;
  }

  updateVisibility(visible: boolean) {
    console.log("🔧 updateVisibility called with:", visible, "selectedId:", this.selectedId);
    if (!this.selectedId) {
      console.log("❌ No selectedId for visibility update");
      return false;
    }

    // Handle image elements
    const img = this.images.get(this.selectedId);
    if (img && img.imageNode) {
      console.log("🖼️ Updating visibility for image:", this.selectedId);
      try {
        img.imageNode.visible(visible);
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        console.log("✅ Image visibility updated successfully");
        return true;
      } catch (error) {
        console.error("❌ updateVisibility error for image:", error);
        return false;
      }
    }

    // Handle shape elements
    let node = this.stage.findOne(`#${this.selectedId}`);
    if (!node) {
      node = this.stage.findOne(`.${this.selectedId}`);
    }
    if (node) {
      console.log("🔧 Updating visibility for shape:", this.selectedId);
      try {
        node.visible(visible);
        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        console.log("✅ Shape visibility updated successfully");
        return true;
      } catch (error) {
        console.error("❌ updateVisibility error for shape:", error);
        return false;
      }
    }

    console.log("❌ No element found to update visibility for:", this.selectedId);
    return false;
  }

  updateShapeSize(width: number, height: number) {
    console.log("🔧 updateShapeSize called with:", { width, height }, "selectedId:", this.selectedId);
    if (!this.selectedId) {
      console.log("❌ No selectedId for size update");
      return false;
    }

    // Handle shape elements
    let node = this.stage.findOne(`#${this.selectedId}`);
    if (!node) {
      node = this.stage.findOne(`.${this.selectedId}`);
    }

    if (node && node instanceof Konva.Shape) {
      console.log("🔧 Updating size for shape:", this.selectedId);
      try {
        // For rectangles
        if (node instanceof Konva.Rect) {
          node.width(width);
          node.height(height);
        }
        // For circles
        else if (node instanceof Konva.Circle) {
          node.radius(Math.max(width, height) / 2);
        }
        // For ellipses
        else if (node instanceof Konva.Ellipse) {
          node.radiusX(width / 2);
          node.radiusY(height / 2);
        }
        // For regular polygons (like triangles)
        else if (node instanceof Konva.RegularPolygon) {
          node.radius(Math.max(width, height) / 2);
        }

        this.layer.batchDraw();
        this._lastSelectedElementData = null;
        console.log("✅ Shape size updated successfully");
        return true;
      } catch (error) {
        console.error("❌ updateShapeSize error for shape:", error);
        return false;
      }
    }

    console.log("❌ No valid shape found to update size for:", this.selectedId);
    return false;
  }

  // Template loading methods
  loadTemplate(templateData: any) {
    console.log("📋 Loading template:", templateData);
    console.log("📋 Template elements:", templateData.elements);
    console.log("📋 Template layers:", templateData.layers);
    console.log("📋 Template background:", templateData.background);
    console.log("📋 Template metadata:", templateData.metadata);

    // Clear existing elements
    this.clearAll();

    // Store template reference
    this.currentTemplate = templateData;

    // Load background
    if (templateData.background) {
      this.loadBackground(templateData.background);
    }

    // Handle different template data structures
    let elements = [];

    // Check if template has layers (preferred format)
    if (templateData.layers && Array.isArray(templateData.layers)) {
      elements = templateData.layers;
    }
    // Check if template has elements (mock template format)
    else if (templateData.elements && Array.isArray(templateData.elements)) {
      elements = templateData.elements;
    }
    // Check if template has metadata with elements
    else if (templateData.metadata && templateData.metadata.elements && Array.isArray(templateData.metadata.elements)) {
      elements = templateData.metadata.elements;
    }

    // Load elements/layers
    if (elements.length > 0) {
      elements.forEach((element: any) => {
        this.loadElement(element);
      });
    }

        // Save initial state
    this.saveState();

    // Refresh canvas to ensure everything is rendered
    console.log("🔄 Refreshing canvas layer...");
    this.layer.draw();
    console.log("✅ Canvas layer drawn");

    // Force HTML overlay refresh
    console.log("🔄 Refreshing HTML overlay...");
    this.refreshHtmlOverlay();
    console.log("✅ HTML overlay refreshed");

    // Force stage draw as well
    console.log("🔄 Drawing stage...");
    this.stage.draw();
    console.log("✅ Stage drawn");

    console.log("✅ Template loaded successfully");
  }

  private clearAll() {
    // Clear texts
    this.texts.forEach((st) => {
      st.textNode.destroy();
      st.div.remove();
    });
    this.texts.clear();

    // Clear images
    this.images.forEach((img) => {
      img.imageNode.destroy();
    });
    this.images.clear();

    // Clear other elements
    this.layer.find('.template-element').forEach((node) => {
      node.destroy();
    });

    // Clear selection
    this.selectedId = null;
    this.transformer.nodes([]);
    this._lastSelectedElementData = null;
  }

  private loadBackground(background: any) {
    if (background.color) {
      const bgRect = new Konva.Rect({
        x: 0,
        y: 0,
        width: this.stage.width(),
        height: this.stage.height(),
        fill: background.color,
        listening: false,
        name: 'background',
        className: 'template-element'
      });
      this.layer.add(bgRect);
    }
  }

    private loadElement(elementData: any) {
    console.log("📋 Loading element:", elementData);
    console.log("📋 Element type:", elementData.type);
    console.log("📋 Element content:", elementData.content || elementData.text);

    try {
      switch (elementData.type) {
        case 'text':
          this.loadTextElement(elementData);
          break;
        case 'image':
          this.loadImageElement(elementData);
          break;
        case 'rect':
        case 'rectangle':
          this.loadShapeElement(elementData);
          break;
        case 'circle':
        case 'ellipse':
        case 'triangle':
          this.loadShapeElement(elementData);
          break;
        default:
          console.warn("⚠️ Unknown element type:", elementData.type);
      }
    } catch (error) {
      console.error("❌ Error loading element:", elementData, error);
    }
  }

  private loadLayer(layerData: any) {
    console.log("📋 Loading layer:", layerData);

    try {
      switch (layerData.type) {
        case 'text':
          this.loadTextElement(layerData);
          break;
        case 'image':
          this.loadImageLayer(layerData);
          break;
        case 'rectangle':
        case 'circle':
        case 'ellipse':
        case 'triangle':
          this.loadShapeLayer(layerData);
          break;
        default:
          console.warn("⚠️ Unknown layer type:", layerData.type);
      }
    } catch (error) {
      console.error("❌ Error loading layer:", layerData.id, error);
    }
  }

  private loadTextElement(elementData: any) {
    const id = elementData.id || `txt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.log("📝 Creating text element:", elementData.text || elementData.content);
    console.log("📝 Element data:", elementData);

    // Create Konva Text node - handle both mock template format and standard format
    const textNode = new Konva.Text({
      x: elementData.x || 0,
      y: elementData.y || 0,
      text: elementData.text || elementData.content || 'Text',
      fontSize: elementData.fontSize || 16,
      fontFamily: elementData.fontFamily || 'Arial',
      fill: elementData.fill || elementData.color || '#000000',
      width: elementData.width || 200,
      height: elementData.height || (elementData.fontSize || 16) * 1.2,
      draggable: !elementData.lockPosition,
      name: id,
      id: id,
      rotation: elementData.rotation || 0,
      align: elementData.textAlign || 'left',
      listening: true,
      fontStyle: this.getFontStyle(elementData),
      className: 'template-element'
    });

    console.log("📝 Adding text node to layer:", textNode);
    this.layer.add(textNode);
    console.log("📝 Text node added, layer children count:", this.layer.children?.length || 0);

    // Create HTML overlay div
    const div = document.createElement("div");
    div.className = "text-div";
    div.dataset.id = id;
    div.contentEditable = "false";
    div.style.position = "absolute";
    div.style.fontFamily = elementData.fontFamily || 'Arial';
    div.style.fontSize = `${elementData.fontSize || 16}px`;
    div.style.lineHeight = "1.2";
    div.style.pointerEvents = "none";
    div.style.color = elementData.fill || elementData.color || '#000000';
    div.style.textAlign = elementData.textAlign || 'left';
    div.style.fontWeight = elementData.fontWeight || 'normal';
    div.style.fontStyle = elementData.fontStyle || 'normal';
    div.style.textDecoration = elementData.textDecoration || 'none';
    div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    div.style.border = "1px solid transparent";
    div.style.borderRadius = "4px";
    div.style.outline = "none";
    div.style.padding = "2px 4px";
    div.style.margin = "0";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.overflow = "hidden";
    div.style.cursor = "text";
    div.style.transition = "all 0.2s ease";
    div.style.boxSizing = "border-box";
    div.style.transformOrigin = "0 0";
    div.style.opacity = "0";
    div.innerText = elementData.text || elementData.content || 'Text';
    this.overlay.appendChild(div);

    const state: TextNodeState = { id, textNode, div, editing: false };
    this.texts.set(id, state);

    // Set up event handlers
    this.setupTextEventHandlers(textNode, div, id);

    // Sync the HTML overlay to make the text visible
    this.syncKonvaToHtml();
  }

  private loadImageElement(elementData: any) {
    const id = elementData.id || `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Create placeholder image for Konva.Image
    const placeholderImg = new Image();
    placeholderImg.width = elementData.width || 100;
    placeholderImg.height = elementData.height || 100;

    // Create image node
    const imageNode = new Konva.Image({
      x: elementData.x || 0,
      y: elementData.y || 0,
      width: elementData.width || 100,
      height: elementData.height || 100,
      image: placeholderImg, // Required property
      draggable: !elementData.lockPosition,
      name: id,
      id: id,
      rotation: elementData.rotation || 0,
      listening: true,
      className: 'template-element',
      opacity: 1,
      visible: true
    });

    this.layer.add(imageNode);

    // Load image if URL is provided
    if (elementData.url || elementData.src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageNode.image(img);
        this.layer.draw();
      };
      img.src = elementData.url || elementData.src;
    }

    const state: ImageNodeState = { id, imageNode, editing: false };
    this.images.set(id, state);
  }

  private loadShapeElement(elementData: any) {
    const id = elementData.id || `shape_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.log("🎨 Creating shape element:", elementData);
    console.log("🎨 Shape type:", elementData.type);
    console.log("🎨 Shape position:", elementData.x, elementData.y);
    console.log("🎨 Shape fill:", elementData.fill || elementData.color || '#3b82f6');

    let shapeNode: Konva.Shape;

    switch (elementData.type) {
      case 'rect':
      case 'rectangle':
        shapeNode = new Konva.Rect({
          x: elementData.x || 0,
          y: elementData.y || 0,
          width: elementData.width || 100,
          height: elementData.height || 50,
          fill: elementData.fill || elementData.color || '#3b82f6',
          stroke: elementData.stroke || elementData.borderColor,
          strokeWidth: elementData.strokeWidth || 0,
          cornerRadius: elementData.cornerRadius || 0,
        });
        break;
      case 'circle':
        shapeNode = new Konva.Circle({
          x: (elementData.x || 0) + (elementData.radius || 25),
          y: (elementData.y || 0) + (elementData.radius || 25),
          radius: elementData.radius || 25,
          fill: elementData.fill || elementData.color || '#3b82f6',
          stroke: elementData.stroke || elementData.borderColor,
          strokeWidth: elementData.strokeWidth || 0,
        });
        break;
      case 'ellipse':
        shapeNode = new Konva.Ellipse({
          x: (elementData.x || 0) + (elementData.radiusX || 50),
          y: (elementData.y || 0) + (elementData.radiusY || 25),
          radiusX: elementData.radiusX || 50,
          radiusY: elementData.radiusY || 25,
          fill: elementData.fill || elementData.color || '#3b82f6',
          stroke: elementData.stroke || elementData.borderColor,
          strokeWidth: elementData.strokeWidth || 0,
        });
        break;
      case 'triangle':
        shapeNode = new Konva.RegularPolygon({
          x: (elementData.x || 0) + (elementData.radius || 25),
          y: (elementData.y || 0) + (elementData.radius || 25),
          sides: 3,
          radius: elementData.radius || 25,
          fill: elementData.fill || elementData.color || '#3b82f6',
          stroke: elementData.stroke || elementData.borderColor,
          strokeWidth: elementData.strokeWidth || 0,
        });
        break;
      default:
        console.warn("Unknown shape type:", elementData.type);
        return;
    }

    shapeNode.setAttrs({
      draggable: !elementData.lockPosition,
      name: id,
      id: id,
      rotation: elementData.rotation || 0,
      listening: true,
      className: 'template-element',
      opacity: 1,
      visible: true
    });

    console.log("🎨 Adding shape node to layer:", shapeNode);
    this.layer.add(shapeNode);
    console.log("🎨 Shape node added, layer children count:", this.layer.children?.length || 0);
    console.log("🎨 Shape visible:", shapeNode.visible());
    console.log("🎨 Shape opacity:", shapeNode.opacity());
    console.log("🎨 Shape fill:", shapeNode.fill());

    const state: ShapeNodeState = { id, shapeNode, editing: false };
    this.shapes.set(id, state);
  }

  private loadImageLayer(layerData: any) {
    const id = layerData.id || `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    if (layerData.isPlaceholder) {
      // Create placeholder rectangle
      const placeholder = new Konva.Rect({
        x: layerData.x || 0,
        y: layerData.y || 0,
        width: layerData.width || 100,
        height: layerData.height || 100,
        fill: '#f0f0f0',
        stroke: '#d0d0d0',
        strokeWidth: 2,
        dash: [5, 5],
        draggable: !layerData.lockPosition,
        name: id,
        id: id,
        listening: true,
        className: 'template-element'
      });

      // Add placeholder text
      const placeholderText = new Konva.Text({
        x: layerData.x || 0,
        y: (layerData.y || 0) + (layerData.height || 100) / 2 - 10,
        text: layerData.placeholderHint || 'Image Placeholder',
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#666666',
        width: layerData.width || 100,
        align: 'center',
        listening: false,
        name: `${id}_text`,
        className: 'template-element'
      });

      this.layer.add(placeholder, placeholderText);

      // Set up event handlers
      placeholder.on("click", (e) => {
        e.cancelBubble = true;
        this.select(placeholder);
      });

      this.images.set(id, {
        id,
        imageNode: placeholder as any, // Store as image node for consistency
        editing: false,
      });
    } else if (layerData.src) {
      // Load actual image
      this.addImageFromUrl(layerData.src, layerData.x || 0, layerData.y || 0);
    }
  }

  private loadShapeLayer(layerData: any) {
    const id = layerData.id || `${layerData.type}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    let shape: Konva.Shape;
    
    switch (layerData.type) {
      case 'rectangle':
        shape = new Konva.Rect({
          x: layerData.x || 0,
          y: layerData.y || 0,
          width: layerData.width || 100,
          height: layerData.height || 80,
          fill: layerData.fill || '#3B82F6',
          stroke: layerData.stroke || '#1E40AF',
          strokeWidth: layerData.strokeWidth || 2,
          draggable: !layerData.lockPosition,
          name: id,
          id: id,
          rotation: layerData.rotation || 0,
          className: 'template-element'
        });
        break;
        
      case 'circle':
        shape = new Konva.Circle({
          x: (layerData.x || 0) + (layerData.radius || 50),
          y: (layerData.y || 0) + (layerData.radius || 50),
          radius: layerData.radius || 50,
          fill: layerData.fill || '#8B5CF6',
          stroke: layerData.stroke || '#6D28D9',
          strokeWidth: layerData.strokeWidth || 2,
          draggable: !layerData.lockPosition,
          name: id,
          id: id,
          rotation: layerData.rotation || 0,
          className: 'template-element'
        });
        break;
        
      case 'ellipse':
        shape = new Konva.Ellipse({
          x: (layerData.x || 0) + (layerData.radiusX || 60),
          y: (layerData.y || 0) + (layerData.radiusY || 40),
          radiusX: layerData.radiusX || 60,
          radiusY: layerData.radiusY || 40,
          fill: layerData.fill || '#F97316',
          stroke: layerData.stroke || '#EA580C',
          strokeWidth: layerData.strokeWidth || 2,
          draggable: !layerData.lockPosition,
          name: id,
          id: id,
          rotation: layerData.rotation || 0,
          className: 'template-element'
        });
        break;
        
      case 'triangle':
        shape = new Konva.RegularPolygon({
          x: (layerData.x || 0) + (layerData.radius || 50),
          y: (layerData.y || 0) + (layerData.radius || 50),
          sides: 3,
          radius: layerData.radius || 50,
          fill: layerData.fill || '#10B981',
          stroke: layerData.stroke || '#059669',
          strokeWidth: layerData.strokeWidth || 2,
          draggable: !layerData.lockPosition,
          name: id,
          id: id,
          rotation: layerData.rotation || 0,
          className: 'template-element'
        });
        break;
        
      default:
        console.warn("⚠️ Unknown shape type:", layerData.type);
        return;
    }
    
    // Set up event handlers
    shape.on("transform", () => {
      try {
        this.layer.batchDraw();
      } catch (error) {
        console.warn("⚠️ Transform event error:", error);
      }
    });
    
    shape.on("dragmove", () => {
      try {
        this.layer.batchDraw();
      } catch (error) {
        console.warn("⚠️ Drag event error:", error);
      }
    });

    shape.on("click", (e) => {
      e.cancelBubble = true;
      this.select(shape);
    });

    this.layer.add(shape);
  }

  private getFontStyle(layerData: any): string {
    let style = '';
    if (layerData.fontWeight === 'bold') style += 'bold ';
    if (layerData.fontStyle === 'italic') style += 'italic';
    return style.trim() || 'normal';
  }

  private setupTextEventHandlers(textNode: Konva.Text, div: HTMLDivElement, id: string) {
    textNode.on("dblclick dbltap", () => this.enterEdit(id));
    textNode.on("transform", () => this.syncKonvaToHtml());
    textNode.on("dragmove", () => this.syncKonvaToHtml());
    textNode.on("dragend", () => this.syncKonvaToHtml());

    div.addEventListener("click", (e) => {
      e.stopPropagation();
      this.select(textNode);
    });
    
    div.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.enterEdit(id);
    });

    // Hover effects
    div.addEventListener("mouseenter", () => {
      const currentState = this.texts.get(id);
      if (currentState && !currentState.editing) {
        div.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        div.style.border = "1px solid rgba(75, 156, 255, 0.5)";
      }
    });

    div.addEventListener("mouseleave", () => {
      const currentState = this.texts.get(id);
      if (currentState && !currentState.editing) {
        div.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        div.style.border = "1px solid transparent";
      }
    });
  }

  // Get current template data
  getCurrentTemplate() {
    return this.currentTemplate;
  }

  // Export current design as template
  exportAsTemplate(metadata: any) {
    const templateData = this.toJSON();
    return {
      metadata,
      layers: templateData.texts.concat(templateData.images.map(img => ({
        id: img.id,
        position: img.position,
        size: img.size,
        content: img.style.src || '',
        style: {
          fontFamily: '',
          fontSize: 0,
          color: '',
          textAlign: '',
          fontWeight: '',
          fontStyle: '',
          textDecoration: '',
        }
      }))),
      background: this.currentTemplate?.background || { color: '#ffffff' },
      variables: this.currentTemplate?.variables || {},
      aiConfig: this.currentTemplate?.aiConfig || {}
    };
  }
}
