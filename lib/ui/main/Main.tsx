import styles from "./Main.module.css";

const Main = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return <main className={styles.content}>{children}</main>;
};

export default Main;
