"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import logo from "@/public/logo.svg";

const Header = () => {
	const [visible, setVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);

	useEffect(() => {
		const onScroll = () => {
			const currentScrollY = window.scrollY;

			// если скроллим вверх — показываем
			if (currentScrollY < lastScrollY) {
				setVisible(true);
			}
			// если вниз и не в самом верху — скрываем
			else if (currentScrollY > lastScrollY && currentScrollY > 25) {
				setVisible(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	}, [lastScrollY]);

	return (
		<header
			className={`${styles.header} ${
				visible ? styles.show : styles.hide
			}`}
		>
			<div className={styles.brand_banner}>
				<Link href="/">
					<Image
						className={styles.brand_banner_Logo}
						src={logo}
						alt="Logo"
					/>
				</Link>
			</div>
		</header>
	);
};

export default Header;
