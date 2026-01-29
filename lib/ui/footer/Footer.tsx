import { Button } from "@/lib/ui/Buttons/Buttons";
import styles from "./Footer.module.css";

const Footer = () => {
	return (
		<footer
			className={
				styles.footer +
				" " +
				"mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm"
			}
		>
			<p>Nimbus Cloud Storage • v0.1.1beta • © 2026 Все права защищены</p>
			<h2>Разработчики:</h2>
			<div
				className="authButtons"
				style={{ width: "fit-content", margin: "0 auto" }}
			>
				<Button>Ибрагимов Айаз</Button>
				<Button>Верхорубов Владислав</Button>
				<Button>Хапаева Виктория</Button>
			</div>
		</footer>
	);
};

export default Footer;
