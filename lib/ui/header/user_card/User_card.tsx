import styles from "./User_card.module.css";

import Image from "next/image";
import Link from "next/link";

import user_icon_default from "@/public/user.png";

const User_card = ({
	username,
	avatar_link,
}: {
	username: string;
	avatar_link: string;
}) => {
	return (
		<>
			<Link className={styles.user_card} href={`/profile/${username}`}>
				<div>
					<Image
						src={avatar_link || user_icon_default}
						alt="User Avatar"
						width={32}
						height={32}
					/>
					<div>{username}</div>
				</div>
			</Link>
		</>
	);
};

export default User_card;
