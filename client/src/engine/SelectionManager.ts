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

export class SelectionManager {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private transformer: Konva.Transformer;
  private overlay: HTMLDivElement;
  private zoom = 1;
  private selectedId: string | null = null;
  private texts = new Map<string, TextNodeState>();
  private images = new Map<string, ImageNodeState>();
  private _lastSelectedElementData: any = null;
  private _textEditTimeout: NodeJS.Timeout | null = null;

  // History management
  private history: any[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;

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
      this.layer.draw();
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

    this.layer.draw();

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

  /** Sync Konva → HTML */
  syncKonvaToHtml() {
    for (const st of this.texts.values()) {
      if (!st.textNode) {
        console.warn(
          "⚠️ syncKonvaToHtml: textNode is undefined for text element"
        );
        continue;
      }

      try {
        const textNode = st.textNode;
      const div = st.div;

      const x = textNode.x();
      const y = textNode.y();
      const rotation = textNode.rotation();
      const scaleX = textNode.scaleX();
      const scaleY = textNode.scaleY();
        const textWidth = textNode.width();
        const textHeight = textNode.height();

      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
        div.style.width = `${textWidth}px`;
        div.style.height = `${textHeight}px`;
        div.style.transformOrigin = "0 0";
        div.style.transform = `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
        div.style.textAlign = textNode.align() || "center";
        div.style.fontSize = `${textNode.fontSize()}px`;
        div.style.fontFamily = textNode.fontFamily();
        div.style.color = textNode.fill();
        div.style.fontWeight = textNode.fontStyle().includes("bold")
          ? "bold"
          : "normal";
        div.style.fontStyle = textNode.fontStyle().includes("italic")
          ? "italic"
          : "normal";
      } catch (error) {
        console.error("❌ syncKonvaToHtml error:", error);
      }
    }
  }

  /** Sync HTML → Konva */
  syncHtmlToKonva() {
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
          // Only update if dimensions are reasonable
          if (currentWidth < 2000 && currentHeight < 2000) {
            st.textNode.width(currentWidth);
            st.textNode.height(currentHeight);
          } else {
            console.warn("⚠️ syncHtmlToKonva: Unreasonable dimensions:", currentWidth, currentHeight);
          }
        }
      } catch (error) {
        console.error("❌ syncHtmlToKonva error:", error);
      }
    }

    try {
      this.layer.batchDraw();
    } catch (drawError) {
      console.warn("⚠️ syncHtmlToKonva batchDraw error:", drawError);
    }
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
        e.cancelBubble = true;
        this.select(ki);
      });

      // Add to the images map so it can be managed like other elements
      this.images.set(generatedId, {
        id: generatedId,
        imageNode: ki,
        editing: false,
      });

      this.layer.add(ki);
      this.layer.draw();

      // Select the newly added image
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
    if (!this.selectedId) return null;

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
    const img = this.images.get(this.selectedId);
    if (img && img.imageNode) {
      try {
        const { x, y } = img.imageNode.position();
        const { width, height } = img.imageNode.getClientRect();
        const rotation = img.imageNode.rotation();
        const scaleX = img.imageNode.scaleX();
        const scaleY = img.imageNode.scaleY();

        return {
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

  deleteSelected() {
    if (!this.selectedId) return;
    
    // Handle text elements
    const st = this.texts.get(this.selectedId);
    if (st) {
      st.textNode.destroy();
      st.div.remove();
      this.texts.delete(this.selectedId);
    } else {
      // Handle shapes and images - try both id and name selectors
      let node = this.stage.findOne(`#${this.selectedId}`);
      if (!node) {
        node = this.stage.findOne(`.${this.selectedId}`);
      }
      if (node) {
        node.destroy();
      }
    }

    // Clear selection state
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
    
    return { texts };
  }

  fromJSON(data: any) {
    this.texts.forEach((st) => {
      st.textNode.destroy();
      st.div.remove();
    });
    this.texts.clear();
    
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
    this._lastSelectedElementData = null;
  }
}
