import styles from "./Brand_banner.module.css";

import logo from "@/public/logo.svg";

import Image from "next/image";
import Link from "next/link";

const Brand_banner = () => {
	return (
		<>
			<div className={styles.brand_banner}>
				<Link className={styles.brand_banner_Link} href="/">
					<Image
						className={styles.brand_banner_Logo}
						src={logo}
						alt="Logo"
					/>
					<span className={styles.brand_banner_Text}>Nimbus</span>
				</Link>
			</div>
		</>
	);
};
export default Brand_banner;
