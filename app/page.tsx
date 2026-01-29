"use client";

import styles from "./page.module.css";

import Image from "next/image";

import img1 from "@/public/image1.png";

export default function page() {
	return (
		<>
			<div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
				<section>
					<div className={styles.hero}>
						<div className={styles.heroInner}>
							<div className={styles.heroText}>
								<h1 className={styles.title}>
									Nimbus — личное облачное хранилище
								</h1>
								<p className={styles.subtitle}>
									Безопасное и простое хранилище для ваших
									файлов. Быстрая загрузка, приватность и
									прозрачная интеграция с S3‑совместимыми
									хранилищами.
								</p>
							</div>

							<div style={{ minWidth: 260 }}>
								<Image
									src={img1}
									alt="Cloud"
									style={{
										width: 320,
										height: 200,
										objectFit: "cover",
										borderRadius: 10,
									}}
								/>
							</div>
						</div>

						<div className={styles.features}>
							<div className={styles.featureCard}>
								<strong>Надёжность</strong>
								<p className={styles.muted}>
									PostgreSQL для метаданных, проверенные
									алгоритмы хеширования.
								</p>
							</div>
							<div className={styles.featureCard}>
								<strong>Масштабируемость</strong>
								<p className={styles.muted}>
									Интеграция с AWS S3 и S3‑совместимыми
									решениями.
								</p>
							</div>
							<div className={styles.featureCard}>
								<strong>Безопасность</strong>
								<p className={styles.muted}>
									argon2 / bcryptjs для защиты паролей и
									сессий.
								</p>
							</div>
						</div>

						<div className={styles.features}>
							<div className={styles.featureCard}>
								<strong>Простота использования</strong>
								<p className={styles.muted}>
									Интуитивный интерфейс и быстрый доступ к
									файлам.
								</p>
							</div>
							<div className={styles.featureCard}>
								<strong>Интеграции</strong>
								<p className={styles.muted}>
									Поддержка внешних сервисов и API для
									автоматизации.
								</p>
							</div>
						</div>
					</div>
				</section>
				<section className={styles.section}>
					<h2 style={{ marginTop: 0 }}>Готово к использованию</h2>
					<p className={styles.muted}>
						Зарегистрируйтесь, чтобы протестировать загрузку и
						управление файлами. Система использует PostgreSQL для
						пользователей и сессий, а для файлов — S3.
					</p>
				</section>
			</div>
		</>
	);
}
