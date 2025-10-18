interface ToggleProps extends React.HTMLAttributes<HTMLInputElement> {
    checked: boolean;
    className?: string;
    label?: string;
}

export const Toggle = (props: ToggleProps) => {
    return (
        <label className={`toggle-label ${props.className}`}>
            <input type="checkbox" {...props} onChange={(e) => {
                props.onChange?.(e);
            }} />
            <span className={`toggle-slider ${props.className}`}></span>
            {props.label && <span className="toggle-label-text">{props.label}</span>}
        </label>
    )
}