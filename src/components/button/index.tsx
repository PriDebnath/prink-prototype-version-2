import { Icons } from "../icon"

type ButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
    className?: string
    dataTooltip?: string
    dataTooltipPos?: "top" | "right" | "bottom" | "left"
}

export type ButtonKeys = keyof typeof Button;

export const Button = {
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

}














