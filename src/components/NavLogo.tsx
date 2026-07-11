import Image from "next/image";
import styles from "./NavLogo.module.css";

export default function NavLogo() {
  return (
    <span className={styles.wrap} aria-hidden="true">
      <span className={styles.glow} />
      <Image
        src="/images/logo-transparent.png"
        alt=""
        width={22}
        height={22}
        className={styles.logo}
        priority
      />
    </span>
  );
}
