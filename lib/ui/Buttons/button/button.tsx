import styles from "./button.module.css";
const Button = ({
	children,
}: Readonly<{
	children?: React.ReactNode;
}>) => {
	return <button className={styles.button}>{children}</button>;
};

export default Button;
