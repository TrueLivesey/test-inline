import Swiper from 'swiper';
import 'swiper/css';

export default function loadSwiper(containerID) {
  const swiper = new Swiper(`#${containerID}`, {
    slidesPerView: 'auto',
    // spaceBetween: 22,

    breakpoints: {
      320: {
        spaceBetween: 16,
      },

      576: {
        spaceBetween: 22,
      },
    },
  });
}
