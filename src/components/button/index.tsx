import { Icons } from "../icon"

type ButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
    className?: string
    datatooltip?: string
    dataTooltipPos?: "top" | "right" | "bottom" | "left"
}

export type ButtonKeys = keyof typeof Button;

export const Button = {
    // Topbar
    grid: (props: ButtonProps) => {
        return (
            <button id="tool-grid"
                {...props}
                data-tooltip={props.datatooltip || "Toggle Grid"}
                data-tooltip-pos={props.dataTooltipPos || "bottom"}
                className={`tool-btn tooltip ${props.className}`}
            >
                <Icons.grid />
            </button>
        )
    }
    ,
    settings: (props: ButtonProps) => {
        return (
            <button id="tool-settings"
                {...props}
                data-tooltip={props.datatooltip || "Settings"}
                data-tooltip-pos={props.dataTooltipPos || "bottom"}
                className={`tool-btn tooltip ${props.className}`}
            >
                <Icons.settings />
            </button>
        )
    }
    ,
    // Sidebar
    select: (props: ButtonProps) => {
        return (
            <button id="select-pan"
                {...props}
                data-tooltip={props.datatooltip || "Select"}
                data-tooltip-pos={props.dataTooltipPos || "right"}
                className={`tool-btn tooltip ${props.className}`}
            >
                <Icons.select />
            </button>
        )
    }
    ,
    pan: (props: ButtonProps) => {
        return (
            <button id="tool-pan"
                {...props}
                data-tooltip={props.datatooltip || "Pan"}
                data-tooltip-pos={props.dataTooltipPos || "right"}
                className={`tool-btn tooltip ${props.className}`}
            >
                <Icons.pan />
            </button>
        )
    }
    ,
    pen: (props: ButtonProps) => {
        return (
            <button id="tool-pen"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.datatooltip || "Pen"}
                data-tooltip-pos={props.dataTooltipPos || "right"}
            >
                <Icons.pen />
            </button>
        )
    }
    ,
    // Toolbar
    clean: (props: ButtonProps) => {
        return (
            <button id="tool-clean"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.datatooltip || "Clean"}
                data-tooltip-pos={props.dataTooltipPos || "bottom"}
            >
                <Icons.clean />
            </button>
        )
    }
    ,
    pencil: (props: ButtonProps) => {
        return (
            <button id="tool-pencil"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.datatooltip || "Color Pencil"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
            >
                <Icons.pencil />
            </button>
        )
    }
    ,
    lasso: (props: ButtonProps) => {
        return (
            <button id="tool-lasso"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.datatooltip || "Lasso"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
            >
                <Icons.lasso />
            </button>
        )
    }
    ,
    highlighter: (props: ButtonProps) => {
        return (
            <button id="tool-highlighter"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.datatooltip || "Highlighter"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
            >
                <Icons.highlighter />
            </button>
        )
    }
    ,
    airbrush: (props: ButtonProps) => {
        return (
            <button id="tool-airbrush"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.datatooltip || "Airbrush"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
            >
                <Icons.airbrush />
            </button>
        )
    }
    ,
    colorPicker: (props: ButtonProps) => {
        return (
            <button id="tool-color-picker"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.datatooltip || "Color Picker"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
            >
                <Icons.colorPicker />
            </button>
        )
    }
    ,
    eraser: (props: ButtonProps) => {
        return (
            <button id="tool-eraser"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.datatooltip || "Eraser"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
            >
                <Icons.eraser />
            </button>
        )
    }
}














