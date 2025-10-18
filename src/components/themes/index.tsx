import React from 'react';
import type { Theme } from '../../types';

export default function Themes() {
    const themes: Theme[] = [
        {
            id: "apricity",
            name: "Apricity",
            desc: "Warm, nostalgic art pad.",
            colors: {
                bgs: ["#fff4dd", "#e1f0f8", "#f2f7fb"],
                surface: "#FFE6CC",
                text: "#3B2F2A",
                accent: "#2563eb",
                muted: "#8B5E3C"
            },
        },
        {
            id: "inkflow",
            name: "Inkflow",
            desc: "Minimalist, modern sketching.",
            colors: {
                bgs: ["#ffffff"],
                surface: "#F5F5F5",
                text: "#111827",
                accent: "#1E1E1E",
                muted: "#C2C2C2"
            },
        },
        {
            id: "coral-splash",
            name: "Coral Splash",
            desc: "Playful, creative, vibrant.",
            colors: {
                bgs: ["#fffaf9"],
                surface: "#FFE7D9",
                text: "#2b2b2b",
                accent: "#FF6F61",
                muted: "#0E7490"
            },
        },
        {
            id: "graphite",
            name: "Graphite",
            desc: "Sketchbook + grayscale illustration.",
            colors: {
                bgs: ["#ffffff"],
                surface: "#D1D1D1",
                text: "#111827",
                accent: "#2B2B2B",
                muted: "#7A7A7A"
            },
        },
        {
            id: "aurora-prink",
            name: "Aurora Prink",
            desc: "Creative night mode, aurora colors.",
            colors: {
                bgs: ["#0D0D0D"],
                surface: "#0D0D0D",
                text: "#E6F6F1",
                accent: "#6EE7B7",
                muted: "#93C5FD"
            },
        },
        {
            id: "sunset-paper",
            name: "Sunset Paper",
            desc: "Warm, nostalgic art pad.",
            colors: {
                bgs: ["#FFF7F1"],
                surface: "#FFE6CC",
                text: "#3B2F2A",
                accent: "#FFB366",
                muted: "#8B5E3C"
            },
        }
    ];


    const handleThemeClick = (theme: Theme) => {

        const [start, mid, end] = theme.colors.bgs;

        document.documentElement.style.setProperty('--theme-start', start);
        document.documentElement.style.setProperty('--theme-mid', mid || start);
        document.documentElement.style.setProperty('--theme-end', end || start);
        document.documentElement.style.setProperty('--accent', theme.colors.accent);
        console.log(theme);
    }

    return (
        <div>
            <h1>Themes</h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
            }}>
                {themes.map((theme) => {
                    const [start, mid, end] = theme.colors.bgs;
                    return (
                        <div 
                            style={{
                                background: `linear-gradient(120deg, ${start} 0%, ${mid || start} 50%, ${end || start} 100%)`,
                                color: theme.colors.text,
                                border: `2px solid ${theme.colors.accent}`,
                                borderRadius: '0.5rem',
                                padding: '0.5rem 1rem 0.5rem 1rem',
                            }}
                            key={theme.id}
                            onClick={() => handleThemeClick(theme)}
                            >

                            <div >
                                <div>
                                    <div >{theme.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                        {theme.desc}
                                    </div>
                                </div>
                                <button
                                    style={{
                                        color: theme.colors.accent,
                                        backgroundColor: theme.colors.surface,
                                        border: `1px solid ${theme.colors.accent}`,
                                        borderRadius: '0.5rem',
                                        padding: '0.5rem 0 0.5rem 0 0.5rem',
                                        margin: '0.5rem 0 0 0',
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}