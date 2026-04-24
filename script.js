const revealItems = Array.from(document.querySelectorAll(".reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }
      entry.target.classList.add("revealed");
      observer.unobserve(entry.target);
    }
  },
  { threshold: 0.2, rootMargin: "0px 0px -6% 0px" },
);

for (const item of revealItems) {
  observer.observe(item);
}

const preview = document.querySelector(".preview-shell");
const hero = document.querySelector(".hero");

if (preview && hero) {
  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 6;
    const rotateX = (0.5 - y) * 5;
    preview.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  hero.addEventListener("mouseleave", () => {
    preview.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  });
}
