import "./style.css";
import Image from "next/image";

const Header = () => {
	return (
		<header>
			<div className="brand-banner">
				<Image
					width={100}
					height={100}
					src="https://upload.wikimedia.org/wikipedia/en/9/90/The_DuckDuckGo_Duck.png"
					alt=""
					className="brand-banner_logo"
				/>
				<span className="brand-banner_name"></span>
			</div>
		</header>
	);
};

export default Header;
