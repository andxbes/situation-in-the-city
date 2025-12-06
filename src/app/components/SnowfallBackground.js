'use client';

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

const SnowfallBackground = () => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadFull(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = (container) => {
        console.log("Snowfall loaded", container);
    };

    const options = useMemo(
        () => ({
            background: {
                color: {
                    value: "transparent",
                },
            },
            fpsLimit: 60,
            interactivity: {
                events: {
                    onHover: {
                        enable: true,
                        mode: "bubble",
                    },
                },
                modes: {
                    bubble: {
                        distance: 200,
                        duration: 2,
                        opacity: 0.8,
                        size: 10,
                    },
                },
            },
            particles: {
                color: { value: "#FFFFFF" },
                links: { enable: false },
                move: {
                    direction: "bottom",
                    enable: true,
                    outModes: { default: "out" },
                    random: true,
                    speed: { min: 1, max: 3 },
                    straight: false,
                },
                number: { density: { enable: true, area: 800 }, value: 200 },
                opacity: { value: { min: 0.3, max: 0.8 } },
                shape: { type: "circle" },
                size: { value: { min: 1, max: 4 } },
            },
            detectRetina: true,
        }),
        [],
    );

    if (init) {
        return <Particles id="snowfall" particlesLoaded={particlesLoaded} options={options} className="absolute top-0 left-0 w-full h-full -z-10" />;
    }

    return <></>;
};

export default SnowfallBackground;
