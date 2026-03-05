import clsx from "clsx";
import mainStyles from "@/shared/ui/Buttons/button/button.module.css";
import styles from "./button_fill.module.css";

const ButtonFill = ({
  children,
}: Readonly<{
  children?: React.ReactNode;
}>) => {
  return (
    <button className={clsx(mainStyles.button, styles.button_fill)}>
      {children}
    </button>
  );
};

export default ButtonFill;
