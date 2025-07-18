'use client'
import React, { useEffect, useRef, useState } from 'react';

export default function MatrixBackground({ color = '#0F0' }) {
    const canvasRef = useRef(null);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return; // Ensure canvas is available

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Canvas 2D context not available.");
            return;
        }

        // Function to set canvas dimensions
        const setDimensions = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            setCanvasDimensions({ width: canvas.width, height: canvas.height });
        };

        // Set initial dimensions
        setDimensions();

        // Add event listener for window resize
        window.addEventListener('resize', setDimensions);

        // Matrix rain parameters
        const font_size = 18; // Increased for better visibility
        const columns = Math.floor(canvas.width / font_size);
        const drops = Array(columns).fill(0); // y-coordinate for each drop

        // Characters for the matrix rain
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

        // Animation loop
        let animationFrameId;

        const draw = () => {
            // Semi-transparent black rectangle to fade out old characters
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = color;
            ctx.font = `${font_size}px monospace`; // Monospace font for consistent character width

            for (let i = 0; i < drops.length; i++) {
                const text = characters.charAt(Math.floor(Math.random() * characters.length));
                ctx.fillText(text, i * font_size, drops[i] * font_size);

                // Sending the drop back to the top randomly after it has crossed the screen
                // Adding a random factor to make it look more natural
                if (drops[i] * font_size > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                // Increment y-coordinate for the next frame
                drops[i]++;
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        // Start the animation
        draw();

        // Cleanup function
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', setDimensions);
        };
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-0" // Tailwind classes for full screen and layering
            style={{ backgroundColor: 'black' }} // Fallback background color
        ></canvas>
    );
};
