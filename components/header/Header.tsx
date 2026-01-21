import "./styles.css";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/vercel.svg";

const Header = () => {
	return (
		<header>
			<div className="brand-banner">
				<Link href="/">
					<Image
						width={100}
						height={100}
						src={logo}
						alt=""
						className="brand-banner_logo"
					/>
				</Link>
				<span className="brand-banner_name"></span>
			</div>
		</header>
	);
};

export default Header;
