import { useEffect } from 'react';

interface UseDesignerKeyboardProps {
  canvasDimensions: { width: number; height: number };
  fabricEditor: any;
  onResizeCanvas: (width: number, height: number) => void;
  onUpdateCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  onAddText: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
}

export function useDesignerKeyboard({
  canvasDimensions,
  fabricEditor,
  onResizeCanvas,
  onUpdateCanvasDimensions,
  onAddText,
  onDuplicateSelected,
  onDeleteSelected,
}: UseDesignerKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!fabricEditor?.isInitialized()) return;

      // Don't handle shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          (event.target as HTMLElement)?.contentEditable === 'true') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Canvas resizing shortcuts
      if (cmdOrCtrl) {
        switch (event.key) {
          case '=':
          case '+':
            event.preventDefault();
            if (fabricEditor) {
              const newWidth = Math.min(canvasDimensions.width + 50, 1200);
              const newHeight = Math.min(canvasDimensions.height + 50, 1200);
              onResizeCanvas(newWidth, newHeight);
              onUpdateCanvasDimensions({ width: newWidth, height: newHeight });
            }
            break;
          case '-':
            event.preventDefault();
            if (fabricEditor) {
              const newWidth = Math.max(canvasDimensions.width - 50, 200);
              const newHeight = Math.max(canvasDimensions.height - 50, 200);
              onResizeCanvas(newWidth, newHeight);
              onUpdateCanvasDimensions({ width: newWidth, height: newHeight });
            }
            break;
          case '0':
            event.preventDefault();
            if (fabricEditor) {
              const defaultSize = { width: 800, height: 600 };
              onResizeCanvas(defaultSize.width, defaultSize.height);
              onUpdateCanvasDimensions(defaultSize);
            }
            break;
          case 't':
            event.preventDefault();
            onAddText();
            break;
          case 'd':
            event.preventDefault();
            onDuplicateSelected();
            break;
          case 'i':
            event.preventDefault();
            // Fix interactivity issues
            if (fabricEditor) {
              fabricEditor.fixObjectInteractivity();
            }
            break;
          case 'Backspace':
          case 'Delete':
            event.preventDefault();
            onDeleteSelected();
            break;
        }
      }

      // Arrow keys for precise movement (without modifiers)
      if (!cmdOrCtrl && !event.altKey && !event.shiftKey) {
        switch (event.key) {
          case 'ArrowUp':
            event.preventDefault();
            moveSelectedObjects(0, -1);
            break;
          case 'ArrowDown':
            event.preventDefault();
            moveSelectedObjects(0, 1);
            break;
          case 'ArrowLeft':
            event.preventDefault();
            moveSelectedObjects(-1, 0);
            break;
          case 'ArrowRight':
            event.preventDefault();
            moveSelectedObjects(1, 0);
            break;
        }
      }

      // Shift + Arrow keys for larger movements
      if (event.shiftKey && !cmdOrCtrl) {
        switch (event.key) {
          case 'ArrowUp':
            event.preventDefault();
            moveSelectedObjects(0, -10);
            break;
          case 'ArrowDown':
            event.preventDefault();
            moveSelectedObjects(0, 10);
            break;
          case 'ArrowLeft':
            event.preventDefault();
            moveSelectedObjects(-10, 0);
            break;
          case 'ArrowRight':
            event.preventDefault();
            moveSelectedObjects(10, 0);
            break;
        }
      }
    };

    const moveSelectedObjects = (deltaX: number, deltaY: number) => {
      if (!fabricEditor) return;

      const activeObjects = fabricEditor.getSelectedObjects();
      activeObjects.forEach((obj: any) => {
        obj.set('left', (obj.left || 0) + deltaX);
        obj.set('top', (obj.top || 0) + deltaY);
      });
      fabricEditor.triggerUpdate();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canvasDimensions,
    fabricEditor,
    onResizeCanvas,
    onUpdateCanvasDimensions,
    onAddText,
    onDuplicateSelected,
    onDeleteSelected,
  ]);
}
