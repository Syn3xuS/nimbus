import { Button } from "@/shared/ui/Buttons/Buttons";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p>Nimbus Cloud Storage • v0.1.2beta • © 2026 Все права защищены</p>
      <h2>Разработчик:</h2>
      <div className={styles.authButtons}>
        <Button>Ибрагимов Айаз</Button>
      </div>
    </footer>
  );
};

export default Footer;
