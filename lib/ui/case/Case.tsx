import styles from "./Case.module.css";

const Case = ({
	children,
}: Readonly<{
	children?: React.ReactNode;
}>) => {
	return <div className={styles.case}>{children}</div>;
};

export default Case;
