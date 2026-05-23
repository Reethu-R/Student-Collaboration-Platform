import React, { useRef, useState, useEffect } from "react";

const Whiteboard = ({ socket, groupId, onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#6c63ff");
  const [size, setSize] = useState(4);
  const lastPos = useRef(null);

  const COLORS = ["#6c63ff","#ff6584","#43e97b","#f7971e","#ffffff","#000000","#ff0000","#00bcd4"];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Receive remote draw
    socket.on("whiteboard_draw", (drawData) => {
      drawOnCanvas(ctx, drawData);
    });

    socket.on("whiteboard_state", (history) => {
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      history.forEach((d) => drawOnCanvas(ctx, d));
    });

    socket.on("whiteboard_cleared", () => {
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("whiteboard_draw");
      socket.off("whiteboard_state");
      socket.off("whiteboard_cleared");
    };
  }, []);

  const drawOnCanvas = (ctx, { fromX, fromY, toX, toY, color, size, tool }) => {
    ctx.beginPath();
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.strokeStyle = tool === "eraser" ? "#1a1a24" : color;
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    return {
      x: ((touch?.clientX || e.clientX) - rect.left) * (canvas.width / rect.width),
      y: ((touch?.clientY || e.clientY) - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e) => {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);

    const drawData = { fromX: lastPos.current.x, fromY: lastPos.current.y, toX: pos.x, toY: pos.y, color, size, tool };
    drawOnCanvas(ctx, drawData);
    socket.emit("whiteboard_draw", { groupId, drawData });
    lastPos.current = pos;
  };

  const stopDraw = () => setIsDrawing(false);

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit("whiteboard_clear", { groupId });
  };

  const downloadBoard = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="whiteboard-overlay">
      <div className="whiteboard-container">
        <div className="whiteboard-header">
          <h3>🖊️ Live Whiteboard</h3>
          <div className="wb-controls">
            <button className={`wb-tool ${tool === "pen" ? "active" : ""}`} onClick={() => setTool("pen")}>✏️ Pen</button>
            <button className={`wb-tool ${tool === "eraser" ? "active" : ""}`} onClick={() => setTool("eraser")}>⬜ Eraser</button>
            <div className="wb-colors">
              {COLORS.map((c) => (
                <button key={c} className={`wb-color ${color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setTool("pen") || setColor(c)} />
              ))}
            </div>
            <select className="wb-size" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              <option value={2}>Thin</option>
              <option value={4}>Medium</option>
              <option value={8}>Thick</option>
              <option value={16}>Extra</option>
            </select>
            <button className="wb-btn" onClick={clearBoard}>🗑️ Clear</button>
            <button className="wb-btn" onClick={downloadBoard}>⬇️ Save</button>
            <button className="wb-btn wb-close" onClick={onClose}>✕ Close</button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="whiteboard-canvas"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
