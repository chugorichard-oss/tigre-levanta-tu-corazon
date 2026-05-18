/**
 * Antigravity.js v1.23.2
 * Core Physics Engine for DOM Elements (Powered internally by Matter.js)
 * Implements rigid body bounds, interactive drag/drop, and floaty physics.
 */

class Antigravity {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) throw new Error("Antigravity: Container not found.");

        this.options = Object.assign({
            frictionAir: 0.04,
            restitution: 0.8,
            gravity: { x: 0, y: 0.08 },
            density: 0.001
        }, options);

        // Setup Physics Engine
        this.engine = Matter.Engine.create();
        this.engine.world.gravity.y = this.options.gravity.y;
        this.engine.world.gravity.x = this.options.gravity.x;
        
        // Setup Render mapping
        this.render = Matter.Render.create({
            element: this.container,
            engine: this.engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: 'transparent'
            }
        });
        
        // Hide the canvas, it's only used for raycasting and calculations
        this.render.canvas.style.position = 'absolute';
        this.render.canvas.style.top = '0';
        this.render.canvas.style.left = '0';
        this.render.canvas.style.zIndex = '-1';
        this.render.canvas.style.pointerEvents = 'none';
        this.render.canvas.style.opacity = '0';

        this.elements = [];
        this.bodies = [];
        
        this.initBoundaries();
        this.initMouseInteractivity();
        
        window.addEventListener('resize', () => this.handleResize());
    }

    initBoundaries() {
        const { width, height } = this.getDimensions();
        const thickness = 200; // Thick bounds to prevent tunneling
        
        // Rigid bounds hidden outside the viewport
        this.walls = [
            Matter.Bodies.rectangle(width / 2, -thickness / 2, width * 3, thickness, { isStatic: true, friction: 0, restitution: 1 }), // Top
            Matter.Bodies.rectangle(width / 2, height + thickness / 2, width * 3, thickness, { isStatic: true, friction: 0, restitution: 1 }), // Bottom
            Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height * 3, { isStatic: true, friction: 0, restitution: 1 }), // Left
            Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height * 3, { isStatic: true, friction: 0, restitution: 1 })  // Right
        ];
        
        Matter.World.add(this.engine.world, this.walls);
    }

    getDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    handleResize() {
        const { width, height } = this.getDimensions();
        this.render.canvas.width = width;
        this.render.canvas.height = height;
        
        const thickness = 200;
        Matter.Body.setPosition(this.walls[0], { x: width / 2, y: -thickness / 2 });
        Matter.Body.setPosition(this.walls[1], { x: width / 2, y: height + thickness / 2 });
        Matter.Body.setPosition(this.walls[2], { x: -thickness / 2, y: height / 2 });
        Matter.Body.setPosition(this.walls[3], { x: width + thickness / 2, y: height / 2 });
    }

    addElement(el) {
        // Read dimensions (requires element to be displayed)
        const rect = el.getBoundingClientRect();
        
        // Parse data-x and data-y for initial scatter positioning
        let xAttr = el.getAttribute('data-x');
        let yAttr = el.getAttribute('data-y');
        
        let x = xAttr && xAttr.endsWith('%') ? (parseFloat(xAttr) / 100) * window.innerWidth : parseFloat(xAttr);
        let y = yAttr && yAttr.endsWith('%') ? (parseFloat(yAttr) / 100) * window.innerHeight : parseFloat(yAttr);
        
        // Fallback to random placement
        if (isNaN(x)) x = Math.random() * (window.innerWidth - rect.width) + rect.width/2;
        if (isNaN(y)) y = Math.random() * (window.innerHeight - rect.height) + rect.height/2;

        const body = Matter.Bodies.rectangle(
            x, y, rect.width, rect.height,
            {
                frictionAir: this.options.frictionAir,
                restitution: this.options.restitution,
                density: this.options.density,
                render: { visible: false }
            }
        );

        this.elements.push(el);
        this.bodies.push(body);
        
        Matter.World.add(this.engine.world, body);
        
        // Random initial velocity to start the "floating" motion
        Matter.Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 3,
            y: (Math.random() - 0.5) * 3
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.03);
    }

    initMouseInteractivity() {
        const mouse = Matter.Mouse.create(document.body);
        const mouseConstraint = Matter.MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.15,
                render: { visible: false }
            }
        });
        
        Matter.World.add(this.engine.world, mouseConstraint);
        this.render.mouse = mouse;
        
        // Prevent scroll hijacking on touch devices if not dragging a body
        mouseConstraint.mouse.element.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel);
        mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel);
    }

    start() {
        Matter.Runner.run(this.engine);
        Matter.Render.run(this.render);
        
        // Sync DOM elements with Physics bodies continuously
        Matter.Events.on(this.engine, 'afterUpdate', () => {
            const h = window.innerHeight;

            for (let i = 0; i < this.elements.length; i++) {
                const el = this.elements[i];
                const body = this.bodies[i];
                
                // Active Anti-gravity "bobbing" field
                // Gently pushes items away from top/bottom edges
                if (body.position.y > h * 0.8) {
                    Matter.Body.applyForce(body, body.position, { x: 0, y: -0.0008 * body.mass });
                }
                if (body.position.y < h * 0.2) {
                    Matter.Body.applyForce(body, body.position, { x: 0, y: 0.0008 * body.mass });
                }
                
                // Keep rotation constrained so text remains readable
                if (Math.abs(body.angle) > 0.12) {
                    Matter.Body.setAngularVelocity(body, body.angularVelocity * 0.9);
                    Matter.Body.setAngle(body, body.angle * 0.95);
                }

                // Apply DOM transform (Centered based on body coordinate)
                el.style.transform = `translate(${body.position.x - el.offsetWidth / 2}px, ${body.position.y - el.offsetHeight / 2}px) rotate(${body.angle}rad)`;
            }
        });
    }
}
