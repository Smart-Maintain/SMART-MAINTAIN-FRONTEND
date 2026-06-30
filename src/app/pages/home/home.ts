import {
  Component,
  HostListener,
  AfterViewInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {
  scrolled = false;

  engines = [
    {
      id: '01',
      title: 'TF-2841 Turbofan',
      client: 'Boeing 777-300ER',
      img: '/images/engine-1.jpg',
      health: '92%',
    },
    {
      id: '02',
      title: 'CFM56-7B',
      client: 'Boeing 737-800',
      img: '/images/engine-2.jpg',
      health: '87%',
    },
    {
      id: '03',
      title: 'GP7200',
      client: 'Airbus A380-800',
      img: '/images/engine-3.jpg',
      health: '71%',
    },
    {
      id: '04',
      title: 'LEAP-1A',
      client: 'Airbus A320neo',
      img: '/images/engine-4.jpg',
      health: '96%',
    },
    {
      id: '05',
      title: 'PW1100G-JM',
      client: 'Airbus A320neo',
      img: '/images/engine-5.jpg',
      health: '94%',
    },
    {
      id: '06',
      title: 'Trent 900',
      client: 'Airbus A380-800',
      img: '/images/engine-6.jpg',
      health: '89%',
    },
  ];

  @ViewChildren('engineCanvas') canvasRefs!: QueryList<ElementRef<HTMLCanvasElement>>;

  private images: (HTMLImageElement | null)[] = [];
  private strength = 0;
  private prevScrollY = 0;
  private rands: number[][] = [];
  private rafId?: number;
  private resizeListener?: () => void;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.engines.forEach(() => {
      this.rands.push([Math.random(), Math.random(), Math.random(), Math.random()]);
      this.images.push(null);
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    // Load images
    this.engines.forEach((engine, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.images[i] = img;
        this.resizeCanvases();
      };
      img.src = engine.img;
    });

    this.prevScrollY = window.scrollY;

    // Animation loop
    const animate = () => {
      const scrollY = window.scrollY;
      const scrollDelta = scrollY - this.prevScrollY;
      const dt = 1 / 60;

      const targetStrength = (Math.abs(scrollDelta) * 10) / window.innerHeight;
      this.strength *= Math.exp(-dt * 10);
      this.strength += Math.min(targetStrength, 5);
      const strength = Math.min(1, this.strength);

      this.canvasRefs.forEach((canvasRef, i) => {
        const canvas = canvasRef.nativeElement;
        if (!canvas || !this.images[i]) return;

        if (Math.random() > Math.exp(-dt * 25 * (1 + strength))) {
          this.rands[i] = [Math.random(), Math.random(), Math.random(), Math.random()];
        }

        this.drawImage(canvas, this.images[i]!, strength, this.rands[i] || [0.5, 0.5, 0.5, 0.5]);
      });

      this.prevScrollY = scrollY;
      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);

    this.resizeListener = () => this.resizeCanvases();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
    }
  }

  private resizeCanvases() {
    if (!this.isBrowser) return;
    this.canvasRefs.forEach((canvasRef, i) => {
      const canvas = canvasRef.nativeElement;
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      if (this.images[i]) {
        this.drawImage(canvas, this.images[i]!, 0, this.rands[i] || [0.5, 0.5, 0.5, 0.5]);
      }
    });
  }

  private drawImage(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    strength: number,
    rands: number[],
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    const imgRatio = img.width / img.height;
    const canvasRatio = cw / ch;
    let sw = img.width;
    let sh = img.height;
    let sx = 0;
    let sy = 0;
    if (imgRatio > canvasRatio) {
      sw = img.height * canvasRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / canvasRatio;
      sy = (img.height - sh) / 2;
    }

    ctx.clearRect(0, 0, cw, ch);

    if (strength < 0.01) {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      return;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);

    const numStrips = Math.floor(3 + strength * 12);
    for (let s = 0; s < numStrips; s++) {
      const stripY = Math.floor(rands[s % 4] * ch * (0.3 + s * 0.15)) % ch;
      const stripH = Math.floor(2 + Math.random() * ch * 0.06 * strength);
      const offsetX = (rands[(s + 1) % 4] - 0.5) * cw * 0.15 * strength;

      if (rands[(s + 2) % 4] > 0.7) {
        ctx.drawImage(canvas, 0, stripY, cw, stripH, offsetX, stripY, cw, stripH);
      }
    }

    if (strength > 0.05) {
      const shiftAmount = strength * 6;
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = strength * 0.3;
      ctx.drawImage(canvas, shiftAmount, 0, cw, ch, 0, 0, cw, ch);
      ctx.drawImage(canvas, -shiftAmount, 0, cw, ch, 0, 0, cw, ch);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    if (strength > 0.3) {
      ctx.fillStyle = `rgba(10,10,10,${(strength - 0.3) * 0.3})`;
      ctx.fillRect(0, 0, cw, ch);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 50;
  }

  getHealthColor(health: string) {
    const val = parseInt(health);
    return val > 90 ? '#00A8E8' : val > 75 ? '#F28C28' : '#F28C28';
  }
}
