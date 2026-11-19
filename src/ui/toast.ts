let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string) {
  const t = document.querySelector("#toast") as HTMLElement;
  t.textContent = message;
  t.classList.add("on");
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.remove("on"), 1600);
}
