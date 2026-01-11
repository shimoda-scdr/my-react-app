export const ColoredMessage = (props) => {
    const { color , children } = props;
    const contentStyle = {
        color,
        fontSize: "20px",
        fontWeight: "bold",
    };

    return <p style={contentStyle}>{children}</p>;
};