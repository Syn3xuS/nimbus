import main_styles from "@/lib/ui/Buttons/button/button.module.css";
import styles from "./button_fill.module.css";

const Button_fill = ({
	children,
}: Readonly<{
	children?: React.ReactNode;
}>) => {
	return <button className={main_styles.button + " " + styles.button_fill}>{children}</button>;
};

export default Button_fill;
