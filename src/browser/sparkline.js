export function sparkline() {
	return {
		opts: {},

		init() {
			this.renderChart();

			this.$el.addEventListener("update", () => {
				this.renderChart();
			});
		},

		parseIntWithDefault(val, defaultValue) {
			const parsed = parseInt(val, 10);
			return Number.isNaN(parsed) ? defaultValue : parsed;
		},

		parseFloatWithDefault(val, defaultValue) {
			const parsed = parseFloat(val);
			return Number.isNaN(parsed) ? defaultValue : parsed;
		},

		setup() {
			const dataset = this.$el.dataset;

			const defaultOpts = {
				svg: null,
				width: this.parseIntWithDefault(dataset.width, 100),
				height: this.parseIntWithDefault(dataset.height, 30),
				gap: this.parseIntWithDefault(dataset.gap, 5),
				strokeWidth: this.parseIntWithDefault(dataset.strokeWidth, 2),
				opacity: this.parseFloatWithDefault(dataset.opacity, 1),
				type: dataset.type || "bar",
				colors: dataset.colors || ["gray"],
				points: dataset.points || null,
				labels: dataset.labels || null,
				format: dataset.format || null,
				length: this.parseIntWithDefault(dataset.length, null),
			};

			defaultOpts.svg = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"svg",
			);
			defaultOpts.svg.setAttribute("width", defaultOpts.width);
			defaultOpts.svg.setAttribute("height", defaultOpts.height);

			return defaultOpts;
		},

		validate() {
			const dataset = this.$el.dataset;

			if (!Array.isArray(this.opts.colors)) {
				this.opts.colors = dataset.colors
					? dataset.colors.split(",")
					: ["gray"];
			}

			if (!this.opts.points) return false;

			this.$el.innerHTML = "";

			let parsedPoints = this.opts.points
				.split(",")
				.map((item) => parseInt(item, 10));

			if (this.opts.length !== null && this.opts.length > 0) {
				const targetLen = this.opts.length;
				if (parsedPoints.length > targetLen) {
					parsedPoints = parsedPoints.slice(-targetLen);
				} else if (parsedPoints.length < targetLen) {
					const paddingNeeded = targetLen - parsedPoints.length;
					parsedPoints = [...Array(paddingNeeded).fill(0), ...parsedPoints];
				}
			}

			this.opts.points = parsedPoints;

			return true;
		},

		renderChart() {
			this.opts = this.setup();
			if (!this.validate()) return;

			switch (this.opts.type) {
				case "bar":
					this.bar();
					break;
				case "line":
					this.line();
					break;
				case "area":
					this.area();
					break;
				case "pie":
					this.pie();
					break;
				case "stacked":
					this.stacked();
					break;
				default:
					console.error(`${this.opts.type} is not a valid sparkline type`);
			}
		},

		getLineCoords() {
			if (this.opts.points.length === 0) return [];
			const denominator = this.opts.points.length - 1 || 1;
			const spacing = this.opts.width / denominator;
			const maxValue = Math.max(...this.opts.points);

			return this.opts.points.map((point, idx) => {
				const maxHeight =
					maxValue > 0 ? (point / maxValue) * this.opts.height : 0;
				return {
					x: idx * spacing,
					y: this.opts.height - maxHeight,
				};
			});
		},

		bar() {
			const columnWidth =
				this.opts.gap / this.opts.points.length +
				this.opts.width / this.opts.points.length -
				this.opts.gap;
			const maxValue = Math.max(...this.opts.points);

			this.opts.points.forEach((point, idx) => {
				const color = this.opts.colors[idx % this.opts.colors.length];
				const rect = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"rect",
				);
				const rectHeight =
					maxValue > 0 ? (point / maxValue) * this.opts.height : 0;
				rect.setAttribute("x", idx * columnWidth + idx * this.opts.gap);
				rect.setAttribute("y", this.opts.height - rectHeight);
				rect.setAttribute("width", columnWidth);
				rect.setAttribute("height", rectHeight);
				rect.setAttribute("fill-opacity", this.opts.opacity);
				rect.setAttribute("fill", color);

				const title = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"title",
				);
				title.textContent = point;
				rect.appendChild(title);

				this.opts.svg.appendChild(rect);
			});

			this.$el.appendChild(this.opts.svg);
		},

		line() {
			const coords = this.getLineCoords();
			if (coords.length === 0) return;

			const pointsStr = coords.map((c) => `${c.x},${c.y}`).join(" ");

			const polyline = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"polyline",
			);
			polyline.setAttribute("points", pointsStr);
			polyline.setAttribute("fill", "none");
			polyline.setAttribute("stroke-width", this.opts.strokeWidth);
			polyline.setAttribute("stroke", this.opts.colors[0]);
			this.opts.svg.appendChild(polyline);

			this.$el.appendChild(this.opts.svg);
		},

		area() {
			const coords = this.getLineCoords();
			if (coords.length === 0) return;

			const mainColor = this.opts.colors[0];
			const gradientId = `spark-grad-${Math.random().toString(36).substring(2, 9)}`;

			const defs = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"defs",
			);
			const gradient = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"linearGradient",
			);
			gradient.setAttribute("id", gradientId);
			gradient.setAttribute("x1", "0");
			gradient.setAttribute("y1", "0");
			gradient.setAttribute("x2", "0");
			gradient.setAttribute("y2", "1");

			const stopTop = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"stop",
			);
			stopTop.setAttribute("offset", "0%");
			stopTop.setAttribute("stop-color", mainColor);
			stopTop.setAttribute(
				"stop-opacity",
				(this.opts.opacity * 0.4).toString(),
			);

			const stopBottom = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"stop",
			);
			stopBottom.setAttribute("offset", "100%");
			stopBottom.setAttribute("stop-color", mainColor);
			stopBottom.setAttribute("stop-opacity", "0");

			gradient.appendChild(stopTop);
			gradient.appendChild(stopBottom);
			defs.appendChild(gradient);
			this.opts.svg.appendChild(defs);

			const first = coords[0];
			const last = coords[coords.length - 1];
			let pathData = `M ${first.x},${first.y} `;
			coords.slice(1).forEach((c) => {
				pathData += `L ${c.x},${c.y} `;
			});
			pathData += `L ${last.x},${this.opts.height} L ${first.x},${this.opts.height} Z`;

			const areaPath = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"path",
			);
			areaPath.setAttribute("d", pathData);
			areaPath.setAttribute("fill", `url(#${gradientId})`);
			this.opts.svg.appendChild(areaPath);

			const lineStr = coords.map((c) => `${c.x},${c.y}`).join(" ");
			const polyline = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"polyline",
			);
			polyline.setAttribute("points", lineStr);
			polyline.setAttribute("fill", "none");
			polyline.setAttribute("stroke-width", this.opts.strokeWidth);
			polyline.setAttribute("stroke", mainColor);
			this.opts.svg.appendChild(polyline);

			this.$el.appendChild(this.opts.svg);
		},

		pie() {
			const radius = Math.min(this.opts.width, this.opts.height) / 2;
			const centerX = this.opts.width / 2;
			const centerY = this.opts.height / 2;
			const total = this.opts.points.reduce((acc, val) => acc + val, 0);
			let startAngle = 0;

			this.opts.points.forEach((point, idx) => {
				const color = this.opts.colors[idx % this.opts.colors.length];
				const sliceAngle = total > 0 ? (point / total) * 2 * Math.PI : 0;
				const endAngle = startAngle + sliceAngle;

				const x1 = centerX + radius * Math.cos(startAngle);
				const y1 = centerY + radius * Math.sin(startAngle);
				const x2 = centerX + radius * Math.cos(endAngle);
				const y2 = centerY + radius * Math.sin(endAngle);

				const path = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"path",
				);
				const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
				const d = `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
				path.setAttribute("d", d);
				path.setAttribute("fill", color);

				const title = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"title",
				);
				title.textContent =
					total > 0 ? `${((point / total) * 100).toFixed(2)}%` : "0%";
				path.appendChild(title);

				this.opts.svg.appendChild(path);
				startAngle = endAngle;
			});

			this.$el.appendChild(this.opts.svg);
		},

		stacked() {
			const total = this.opts.points.reduce((a, b) => a + b, 0);
			const totalGapWidth = (this.opts.points.length - 1) * this.opts.gap;
			const availableWidth = this.opts.width - totalGapWidth;

			let offset = 0;
			this.opts.points.forEach((point, idx) => {
				const color = this.opts.colors[idx % this.opts.colors.length];
				const rectWidth = total > 0 ? (point / total) * availableWidth : 0;
				const rect = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"rect",
				);
				rect.setAttribute("x", offset);
				rect.setAttribute("y", 0);
				rect.setAttribute("width", rectWidth);
				rect.setAttribute("height", this.opts.height);
				rect.setAttribute("fill", color);

				const title = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"title",
				);
				title.textContent = point;
				rect.appendChild(title);

				this.opts.svg.appendChild(rect);
				offset += rectWidth + this.opts.gap;
			});

			this.$el.appendChild(this.opts.svg);
		},
	};
}
