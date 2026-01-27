import styles from "./Case.module.css";

type CaseProps = {
	children?: React.ReactNode;
	className?: string;
};

const Case = ({ children, className }: CaseProps) => {
	return (
		<div className={[styles.case, className || ""].join(" ")}>
			{children}
		</div>
	);
};

export default Case;
