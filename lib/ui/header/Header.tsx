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

			if (currentScrollY < lastScrollY) {
				setVisible(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 25) {
				setVisible(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	}, [lastScrollY]);

	const [username, setUsername] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadMe = async () => {
			try {
				const res = await fetch("/api/auth/me");
				if (!res.ok) return;

				const data = await res.json();
				if (data?.user?.username) {
					setUsername(data.user.username);
				}
			} finally {
				setLoading(false);
			}
		};

		loadMe();
	}, []);

	return (
		<>
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

				<div className={styles.authButtons}>
					{loading ? null : username ? (
						<Link href={`/profile/${username}`} className={styles.username}>
							{username}
						</Link>
					) : (
						<>
							<Link href="/auth/login" className={styles.signIn}>
								Sign In
							</Link>
							<Link
								href="/auth/register"
								className={styles.signUp}
							>
								Sign Up
							</Link>
						</>
					)}
				</div>
			</header>
		</>
	);
};

export default Header;
