import { Icons } from "../icon"

type ButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
    className?: string
    dataTooltip?: string
    dataTooltipPos?: "top" | "right" | "bottom" | "left"
}

export type ButtonKeys = keyof typeof Button;

export const Button = {
    // Topbar
    grid: (props: ButtonProps) => {
        return (
            <button id="tool-grid"
                {...props}
                data-tooltip={props.dataTooltip || "Toggle Grid"}
                data-tooltip-pos={props.dataTooltipPos || "right"}
                className={`tool-btn tooltip ${props.className}`}
            >
                <Icons.grid />
            </button>
        )
    }
    ,
    // Sidebar
    select: (props: ButtonProps) => {
        return (
            <button id="select-pan"
                {...props}
                data-tooltip={props.dataTooltip || "Select"}
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
                data-tooltip={props.dataTooltip || "Pan"}
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
                data-tooltip={props.dataTooltip || "Pen"}
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
                data-tooltip={props.dataTooltip || "Clean"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
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
                data-tooltip={props.dataTooltip || "Color Pencil"}
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
                data-tooltip={props.dataTooltip || "Lasso"}
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
                data-tooltip={props.dataTooltip || "Highlighter"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
            >
                <Icons.highlighter />
            </button>
        )
    }
    ,
   colorPicker: (props: ButtonProps) => {
        return (
            <button id="tool-highlighter"
                {...props}
                className={`tool-btn tooltip ${props.className}`}
                data-tooltip={props.dataTooltip || "Color Picker"}
                data-tooltip-pos={props.dataTooltipPos || "top"}
            >
                <Icons.colorPicker />
            </button>
        )
    }
}














