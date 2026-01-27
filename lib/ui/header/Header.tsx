"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Header.module.css";

import { Button, Button_fill } from "@/lib/ui/Buttons/Buttons";
import User_card from "@/lib/ui/header/user_card/User_card";
import Brand_banner from "./brand_banner/Brand_banner";

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
	const avatar_link = "";

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
				<Brand_banner></Brand_banner>

				<Link href={`/disk/${username}`}>Мой диск</Link>

				<div className="authButtons">
					{loading ? null : username ? (
						<>
							<User_card
								username={username}
								avatar_link={avatar_link}
							/>
						</>
					) : (
						<>
							<Link href="/auth/login" className={styles.signIn}>
								<Button>Sign In</Button>
							</Link>
							<Link
								href="/auth/register"
								className={styles.signUp}
							>
								<Button_fill>Sign Up</Button_fill>
							</Link>
						</>
					)}
				</div>
			</header>
		</>
	);
};

export default Header;
