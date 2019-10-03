/**
 * Well known colors for ZIP LEDs
 */
enum ZipLedColors {
    //% block=red
    Red = 0xFF0000,
    //% block=orange
    Orange = 0xFFA500,
    //% block=yellow
    Yellow = 0xFFFF00,
    //% block=green
    Green = 0x00FF00,
    //% block=blue
    Blue = 0x0000FF,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xFF00FF,
    //% block=white
    White = 0xFFFFFF,
    //% block=black
    Black = 0x000000
}
/**
 * Kitronik ZIP Halo HD MakeCode Package
 */
//% weight=100 color=#00A654 icon="\uf111" block="HaloHD"
namespace kitronik_halo_hd {

    ////////////////////////////////
    //           MUSIC            //
    ////////////////////////////////

    /**
     * Setup micro:bit to play music through Halo HD buzzer
     */
    //% blockId="kitronik_halo_hd_buzzer_setup" block="set music pin for buzzer"
    //% weight=100 blockGap=8
    export function setBuzzerPin(): void {
        pins.analogSetPitchPin(AnalogPin.P14)
    }

	////////////////////////////////
    //          ZIP LEDS          //
    ////////////////////////////////
	
	/**
	 * Different modes for RGB or RGB+W ZIP strips
	 */
	export enum ZipLedMode {
	    //% block="RGB (GRB format)"
	    RGB = 0,
	    //% block="RGB+W"
	    RGBW = 1,
	    //% block="RGB (RGB format)"
	    RGB_RGB = 2
	}

    export class ZIPHaloHd {
    	buf: Buffer;
    	pin: DigitalPin;
    	brightness: number;
    	start: number;
    	_length: number;
    	_mode: ZipLedMode;


        /**
         * Shows a rainbow pattern on all LEDs. 
         * @param startHue the start hue value for the rainbow, eg: 1
         * @param endHue the end hue value for the rainbow, eg: 360
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_halo_hd_rainbow" block="%haloDisplay|show rainbow from %startHue|to %endHue" 
        //% weight=94 blockGap=8
        showRainbow(startHue: number = 1, endHue: number = 360) {
            if (this._length <= 0) return;

            startHue = startHue >> 0;
            endHue = endHue >> 0;
            const saturation = 100;
            const luminance = 50;
            const steps = this._length;
            const direction = HueInterpolationDirection.Clockwise;

            //hue
            const h1 = startHue;
            const h2 = endHue;
            const hDistCW = ((h2 + 360) - h1) % 360;
            const hStepCW = Math.idiv((hDistCW * 100), steps);
            const hDistCCW = ((h1 + 360) - h2) % 360;
            const hStepCCW = Math.idiv(-(hDistCCW * 100), steps);
            let hStep: number;
            if (direction === HueInterpolationDirection.Clockwise) {
                hStep = hStepCW;
            } else if (direction === HueInterpolationDirection.CounterClockwise) {
                hStep = hStepCCW;
            } else {
                hStep = hDistCW < hDistCCW ? hStepCW : hStepCCW;
            }
            const h1_100 = h1 * 100; //we multiply by 100 so we keep more accurate results while doing interpolation

            //sat
            const s1 = saturation;
            const s2 = saturation;
            const sDist = s2 - s1;
            const sStep = Math.idiv(sDist, steps);
            const s1_100 = s1 * 100;

            //lum
            const l1 = luminance;
            const l2 = luminance;
            const lDist = l2 - l1;
            const lStep = Math.idiv(lDist, steps);
            const l1_100 = l1 * 100

            //interpolate
            if (steps === 1) {
                this.setZipColor(0, hsl(h1 + hStep, s1 + sStep, l1 + lStep))
            } else {
                this.setZipColor(0, hsl(startHue, saturation, luminance));
                for (let i = 1; i < steps - 1; i++) {
                    const h = Math.idiv((h1_100 + i * hStep), 100) + 360;
                    const s = Math.idiv((s1_100 + i * sStep), 100);
                    const l = Math.idiv((l1_100 + i * lStep), 100);
                    this.setZipColor(i, hsl(h, s, l));
                }
                this.setZipColor(steps - 1, hsl(endHue, saturation, luminance));
            }
            this.show();
        }
		
		/**
         * Displays a vertical bar graph based on the `value` and `high` value.
         * If `high` is 0, the chart gets adjusted automatically.
         * @param value current value to plot
         * @param high maximum value, eg: 255
         */
        //% subcategory="ZIP LEDs"
        //% weight=84
        //% blockId=kitronik_halo_hd_show_bar_graph block="%haloDisplay|show bar graph of %value|up to %high" 
        showBarGraph(value: number, high: number): void {
            if (high <= 0) {
                this.clear();
                this.setZipColor(0, 0xFFFF00);
                this.show();
                return;
            }

            value = Math.abs(value);
            const n = this._length;
            const n1 = n - 1;
            let v = Math.idiv((value * n), high);
            if (v == 0) {
                this.setZipColor(0, 0x666600);
                for (let i = 1; i < n; ++i)
                    this.setZipColor(i, 0);
            } else {
                for (let i = 0; i < n; ++i) {
                    if (i <= v) {
                        const g = Math.idiv(i * 255, n1);
                        //this.setZipColor(i, haloDisplay.rgb(0, g, 255 - g));
						this.setZipColor(i, rgb(g, 255 - g, 0));
                    }
                    else this.setZipColor(i, 0);
                }
            }
            this.show();
        }
		
		 /** 
         * Create a range of LEDs.
         * @param start offset in the LED strip to start the range
         * @param length number of LEDs in the range. eg: 4
         */
        //% subcategory="ZIP LEDs"
        //% weight=89
        //% blockId="kitronik_halo_hd_range" block="%haloDisplay|range from %start|with %length|leds"
        range(start: number, length: number): ZIPHaloHd {
            start = start >> 0;
            length = length >> 0;
            let haloDisplay = new ZIPHaloHd();
            haloDisplay.buf = this.buf;
            haloDisplay.pin = this.pin;
            haloDisplay.brightness = this.brightness;
            haloDisplay.start = this.start + Math.clamp(0, this._length - 1, start);
            haloDisplay._length = Math.clamp(0, this._length - (haloDisplay.start - this.start), length);
            haloDisplay._mode = this._mode;
            return haloDisplay;
        }
		
        /**
         * Rotate LEDs forward.
         * You need to call ``show`` to make the changes visible.
         * @param offset number of ZIP LEDs to rotate forward, eg: 1
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_halo_hd_display_rotate" block="%haloDisplay|rotate ZIP LEDs by %offset" blockGap=8
        //% weight=93
        rotate(offset: number = 1): void {
            const stride = this._mode === ZipLedMode.RGBW ? 4 : 3;
            this.buf.rotate(-offset * stride, this.start * stride, this._length * stride)
        }

    	/**
         * Shows whole ZIP Halo display as a given color (range 0-255 for r, g, b). 
         * @param rgb RGB color of the LED
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_halo_hd_display_set_strip_color" block="%haloDisplay|show color %rgb=kitronik_halo_hd_colors" 
        //% weight=99 blockGap=8
        showColor(rgb: number) {
        	rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * Set particular ZIP LED to a given color. 
         * You need to call ``show changes`` to make the changes visible.
         * @param zipLedNum position of the ZIP LED in the string
         * @param rgb RGB color of the ZIP LED
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_halo_hd_set_zip_color" block="%haloDisplay|set ZIP LED %zipLedNum|to %rgb=kitronik_halo_hd_colors" 
        //% weight=98 blockGap=8
        setZipLedColor(zipLedNum: number, rgb: number): void {
            this.setPixelRGB(zipLedNum >> 0, rgb >> 0);
        }

        /**
         * Send all the changes to the ZIP Halo display.
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_halo_hd_display_show" block="%haloDisplay|show" blockGap=8
        //% weight=96
        show() {
            ws2812b.sendBuffer(this.buf, this.pin);
        }

        /**
         * Turn off all LEDs on the ZIP Halo display.
         * You need to call ``show`` to make the changes visible.
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_halo_hd_display_clear" block="%haloDisplay|clear"
        //% weight=95
        
        clear(): void {
            const stride = this._mode === ZipLedMode.RGBW ? 4 : 3;
            this.buf.fill(0, this.start * stride, this._length * stride);
        }

        /**
         * Set the brightness of the ZIP Halo display. This flag only applies to future operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_halo_hd_display_set_brightness" block="%haloDisplay|set brightness %brightness" blockGap=8
        //% weight=92
        
        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * Set the pin where the ZIP LED is connected, defaults to P8.
         */
        //% weight=10
        
        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 8);
            // don't yield to avoid races on initialization
    	}
		
    	private setZipColor(pixeloffset: number, rgb: number): void {
            this.setPixelRGB(pixeloffset, rgb);
        }

        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
			
            if (this._mode === ZipLedMode.RGB_RGB) {
                this.buf[offset + 0] = red;
                this.buf[offset + 1] = green;
            } else {
                this.buf[offset + 0] = green;
                this.buf[offset + 1] = red;
            }
            this.buf[offset + 2] = blue;
        }

        private setAllRGB(rgb: number) {

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            const br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            const end = this.start + this._length;
            const stride = this._mode === ZipLedMode.RGBW ? 4 : 3;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * stride, red, green, blue)
            }
        }
        private setAllW(white: number) {
            if (this._mode !== ZipLedMode.RGBW)
                return;

            let br = this.brightness;
            if (br < 255) {
                white = (white * br) >> 8;
            }
            let buf = this.buf;
            let end = this.start + this._length;
            for (let i = this.start; i < end; ++i) {
                let ledoffset = i * 4;
                buf[ledoffset + 3] = white;
            }
        }
        private setPixelRGB(pixeloffset: number, rgb: number): void {
            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            let stride = this._mode === ZipLedMode.RGBW ? 4 : 3;
            pixeloffset = (pixeloffset + this.start) * stride;

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            let br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            this.setBufferRGB(pixeloffset, red, green, blue)
        }
        private setPixelW(pixeloffset: number, white: number): void {
            if (this._mode !== ZipLedMode.RGBW)
                return;

            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            pixeloffset = (pixeloffset + this.start) * 4;

            let br = this.brightness;
            if (br < 255) {
                white = (white * br) >> 8;
            }
            let buf = this.buf;
            buf[pixeloffset + 3] = white;
        }
    }

    /**
     * Create a new ZIP LED driver for ZIP Halo Display.
	 * @param numZips number of leds in the strip, eg: 60
     */
    //% subcategory="ZIP LEDs"
    //% blockId="kitronik_halo_hd_display_create" block="to Halo HD with %numZips|Zips"
    //% weight=100 blockGap=8
    //% trackArgs=0,2
    //% blockSetVariable=haloDisplay
    export function createZIPHaloDisplay(numZips: number): ZIPHaloHd {
        let haloDisplay = new ZIPHaloHd();
        let stride = 0 === ZipLedMode.RGBW ? 4 : 3;
        haloDisplay.buf = pins.createBuffer(numZips * stride);
        haloDisplay.start = 0;
        haloDisplay._length = numZips;
        haloDisplay._mode = 0;
        haloDisplay.setBrightness(128)
        haloDisplay.setPin(DigitalPin.P8)
        return haloDisplay;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% subcategory="ZIP LEDs"
    //% weight=1
    //% blockId="kitronik_halo_hd_rgb" block="red %red|green %green|blue %blue"
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
    */
    //% subcategory="ZIP LEDs"
    //% weight=2 blockGap=8
    //% blockId="kitronik_halo_hd_colors" block="%color"
    export function colors(color: ZipLedColors): number {
        return color;
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }

    /**
     * Converts a hue saturation luminosity value into a RGB color
     */
    function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);
        
        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h1 == 0) {
            r$ = c; g$ = x; b$ = 0;
        } else if (h1 == 1) {
            r$ = x; g$ = c; b$ = 0;
        } else if (h1 == 2) {
            r$ = 0; g$ = c; b$ = x;
        } else if (h1 == 3) {
            r$ = 0; g$ = x; b$ = c;
        } else if (h1 == 4) {
            r$ = x; g$ = 0; b$ = c;
        } else if (h1 == 5) {
            r$ = c; g$ = 0; b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return packRGB(r, g, b);
    }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }

    ////////////////////////////////
    //         MICROPHONE         //
    ////////////////////////////////

    /**
    * Read Sound Level blocks returns back a number of the current sound level at that point
    */
    //% subcategory="Microphone"
    //% blockId=kitronik_halo_hd_read_sound_level
    //% block="read sound level"
    //% weight=100 blockGap=8
    export function readSoundLevel() {
        if (kitronik_microphone.initialised == false) {
            kitronik_microphone.init()
        }
        let read = pins.analogReadPin(kitronik_microphone.microphonePin)
        return read
    }

    /**
    * Read Sound Level blocks returns back a number of the current sound level averaged over 5 samples
    */
    //% subcategory="Microphone"
    //% blockId=kitronik_halo_hd_read_average_sound_level
    //% block="read average sound level"
    //% weight=100 blockGap=8
    export function readAverageSoundLevel() {
        let x = 0
        let soundlevel = 0
        let sample = 0

        if (kitronik_microphone.initialised == false) {
            kitronik_microphone.init()
        }

        if (kitronik_microphone.micListening == false) {
            kitronik_microphone.micStartListening()
        }

        for (x = 0; x < 5; x++) {
            sample = kitronik_microphone.samplesArray[x]
            if (sample > soundlevel) {
                soundlevel = sample
            }
        }

        return soundlevel
    }

    /**
    * Performs an action when a spike in sound
    * @param claps is the number of claps to listen out for before running the function eg: 1
    * @param timerperiod is period of time in which to listen for the claps or spikes eg: 1000
    * @param soundSpike_handler is function that is run once detection in sound 
    */
    //% subcategory="Microphone"
    //% blockId=kitronik_halo_hd_wait_for_clap
    //% block="listen for %claps claps within %timerperiod|ms"
    //% claps.min=1 claps.max=10
    //% timerperiod.min=500 timerperiod.max=2500
    //% weight=95 blockGap=8
    export function waitForClap(claps: number, timerperiod: number, soundSpike_handler: Action): void {
        if (kitronik_microphone.initialised == false) {
            kitronik_microphone.init()
        }
        kitronik_microphone.numberOfClaps = claps
        kitronik_microphone.period = timerperiod
        kitronik_microphone.sound_handler = soundSpike_handler
        kitronik_microphone.startClapListening()
    }

    /**
     * Set how sensitive the microphone is when detecting claps
     * @param value - sensitivity (0-100)
     */
    //% subcategory="Microphone"
    //% blockId=kitronik_halo_hd_set_mic_sensitivity
    //% block="Set mic sensitivity to %value"
    //% value.min=0 value.max=100 value.defl=80
    export function setClapSensitivity(value: number): void {
        value = Math.clamp(0, 100, value)
        kitronik_microphone.threshold = kitronik_microphone.baseVoltageLevel + (105 - value)
    }

    ////////////////////////////////
    //         RTC BLOCKS         //
    ////////////////////////////////

    /**
     * Set time on RTC, as three numbers
     * @param setHours is to set the hours
     * @param setMinutes is to set the minutes
     * @param setSeconds is to set the seconds
    */
    //% subcategory="RTC"
    //% blockId=kitronik_halo_hd_set_time 
    //% block="Set Time to %setHours|hrs %setMinutes|mins %setSeconds|secs"
    //% setHours.min=0 setHours.max=23
    //% setMinutes.min=0 setMinutes.max=59
    //% setSeconds.min=0 setSeconds.max=59
    //% weight=100 blockGap=8
    export function setTime(setHours: number, setMinutes: number, setSeconds: number): void {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        let bcdHours = kitronik_RTC.decToBcd(setHours)                           //Convert number to binary coded decimal
        let bcdMinutes = kitronik_RTC.decToBcd(setMinutes)                       //Convert number to binary coded decimal
        let bcdSeconds = kitronik_RTC.decToBcd(setSeconds)                       //Convert number to binary coded decimal
        let writeBuf = pins.createBuffer(2)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                  //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_HOURS_REG
        writeBuf[1] = bcdHours                                      //Send new Hours value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_MINUTES_REG
        writeBuf[1] = bcdMinutes                                    //Send new Minutes value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC | bcdSeconds                            //Send new seconds masked with the Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**
     * Read time from RTC as a string
    */
    //% subcategory="RTC"
    //% blockId=kitronik_halo_hd_read_time 
    //% block="Read Time as String"
    //% weight=95 blockGap=8
    export function readTime(): string {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        //read Values
        kitronik_RTC.readValue()

        let decSeconds = kitronik_RTC.bcdToDec(kitronik_RTC.currentSeconds, kitronik_RTC.RTC_SECONDS_REG)                  //Convert number to Decimal
        let decMinutes = kitronik_RTC.bcdToDec(kitronik_RTC.currentMinutes, kitronik_RTC.RTC_MINUTES_REG)                  //Convert number to Decimal
        let decHours = kitronik_RTC.bcdToDec(kitronik_RTC.currentHours, kitronik_RTC.RTC_HOURS_REG)                        //Convert number to Decimal

        //Combine hours,minutes and seconds in to one string
        let strTime: string = "" + ((decHours / 10)>>0) + decHours % 10 + ":" + ((decMinutes / 10)>>0) + decMinutes % 10 + ":" + ((decSeconds / 10)>>0) + decSeconds % 10

        return strTime
    }

    /**
     * Set date on RTC as three numbers
     * @param setDay is to set the day in terms of numbers 1 to 31
     * @param setMonths is to set the month in terms of numbers 1 to 12
     * @param setYears is to set the years in terms of numbers 0 to 99
    */
    //% subcategory="RTC"
    //% blockId=kitronik_halo_hd_set_date 
    //% block="Set Date to %setDays|Day %setMonths|Month %setYear|Year"
    //% setDay.min=1 setDay.max=31
    //% setMonth.min=1 setMonth.max=12
    //% setYear.min=0 setYear.max=99
    //% weight=90 blockGap=8
    export function setDate(setDay: number, setMonth: number, setYear: number): void {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        let leapYearCheck = 0
        let writeBuf = pins.createBuffer(2)
        let readBuf = pins.createBuffer(1)
        let bcdDay = 0
        let bcdMonths = 0
        let bcdYears = 0
        let readCurrentSeconds = 0

        //Check day entered does not exceed month that has 30 days in
        if ((setMonth == 4) || (setMonth == 6) || (setMonth == 9) || (setMonth == 11)) {
            if (setDay == 31) {
                setDay = 30
            }
        }
        
        //Leap year check and does not exceed 30 days
        if ((setMonth == 2) && (setDay >= 29)) {
            leapYearCheck = setYear % 4
            if (leapYearCheck == 0)
                setDay = 29
            else
                setDay = 28
        }

        bcdDay = kitronik_RTC.decToBcd(setDay)                       //Convert number to binary coded decimal
        bcdMonths = kitronik_RTC.decToBcd(setMonth)                  //Convert number to binary coded decimal
        bcdYears = kitronik_RTC.decToBcd(setYear)                    //Convert number to binary coded decimal

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        readBuf = pins.i2cReadBuffer(kitronik_RTC.CHIP_ADDRESS, 1, false)
        readCurrentSeconds = readBuf[0]

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                  //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_DAY_REG
        writeBuf[1] = bcdDay                                        //Send new Day value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_MONTH_REG
        writeBuf[1] = bcdMonths                                     //Send new Months value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_YEAR_REG
        writeBuf[1] = bcdYears                                      //Send new Year value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC | readCurrentSeconds                    //Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**
     * Read date from RTC as a string
    */
    //% subcategory="RTC"
    //% blockId=kitronik_halo_hd_read_date 
    //% block="Read Date as String"
    //% weight=85 blockGap=8
    export function readDate(): string {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        //read Values
        kitronik_RTC.readValue()

        let decDay = kitronik_RTC.bcdToDec(kitronik_RTC.currentDay, kitronik_RTC.RTC_DAY_REG)                      //Convert number to Decimal
        let decMonths = kitronik_RTC.bcdToDec(kitronik_RTC.currentMonth, kitronik_RTC.RTC_MONTH_REG)               //Convert number to Decimal
        let decYears = kitronik_RTC.bcdToDec(kitronik_RTC.currentYear, kitronik_RTC.RTC_YEAR_REG)                  //Convert number to Decimal

        //let strDate: string = decDay + "/" + decMonths + "/" + decYears
        let strDate: string = "" + ((decDay / 10)>>0) + (decDay % 10) + "/" + ((decMonths / 10)>>0) + (decMonths % 10) + "/" + ((decYears / 10)>>0) + (decYears % 10)
        return strDate
    }

    /**
     * Set the hours on the RTC in 24 hour format
     * @param writeHours is to set the hours in terms of numbers 0 to 23
    */
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_write_hours 
    //% block="Set Hours to %hours|hrs"
    //% hours.min=0 hours.max=23
    //% weight=80 blockGap=8
    export function writeHours(hours: number): void {
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        let bcdHours = kitronik_RTC.decToBcd(hours)
        let writeBuf = pins.createBuffer(2)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                      //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_HOURS_REG
        writeBuf[1] = bcdHours                                      //Send new value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC                                 //Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**Read hours from RTC*/
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_read_hours 
    //% block="Read Hours as Number"
    //% weight=75 blockGap=8
    export function readHours(): number {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        //read Values
        kitronik_RTC.readValue()

        let decHours = kitronik_RTC.bcdToDec(kitronik_RTC.currentHours, kitronik_RTC.RTC_HOURS_REG)                    //Convert number to Decimal
        return decHours
    }

    /**
     * Set the minutes on the RTC
     * @param writeMinutes is to set the minutes in terms of numbers 0 to 59
    */
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_write_minutes 
    //% block="Set Minutes to %minutes|mins"
    //% minutes.min=0 minutes.max=59
    //% weight=70 blockGap=8
    export function writeMinutes(minutes: number): void {
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        let bcdMinutes = kitronik_RTC.decToBcd(minutes)
        let writeBuf = pins.createBuffer(2)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                      //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_MINUTES_REG
        writeBuf[1] = bcdMinutes                                        //Send new value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC                                 //Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**Read minutes from RTC*/
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_read_minutes 
    //% block="Read Minutes as Number"
    //% weight=65 blockGap=8
    export function readMinutes(): number {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        //read Values
        kitronik_RTC.readValue()

        let decMinutes = kitronik_RTC.bcdToDec(kitronik_RTC.currentMinutes, kitronik_RTC.RTC_MINUTES_REG)                  //Convert number to Decimal
        return decMinutes
    }

    /**
     * Set the seconds on the RTC
     * @param writeSeconds is to set the seconds in terms of numbers 0 to 59
    */
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_write_seconds 
    //% block="Set Seconds to %seconds|secs"
    //% seconds.min=0 seconds.max=59
    //% weight=60 blockGap=8
    export function writeSeconds(seconds: number): void {
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        let bcdSeconds = kitronik_RTC.decToBcd(seconds)
        let writeBuf = pins.createBuffer(2)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                      //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC | bcdSeconds                        //Enable Oscillator and Send new value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**Read seconds from RTC*/
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_read_seconds 
    //% block="Read Seconds as Number"
    //% weight=55 blockGap=8
    export function readSeconds(): number {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        //read Values
        kitronik_RTC.readValue()

        let decSeconds = kitronik_RTC.bcdToDec(kitronik_RTC.currentSeconds, kitronik_RTC.RTC_SECONDS_REG)                  //Convert number to Decimal

        return decSeconds
    }


    /**
     * Set the day on the RTC
     * @param writeDay is to set the day in terms of numbers 0 to 31
    */
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_write_day
    //% block="Set Day to %day|day"
    //% day.min=1 day.max=31
    //% weight=50 blockGap=8
    export function writeDay(day: number): void {
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        let bcdDay = kitronik_RTC.decToBcd(day)
        let writeBuf = pins.createBuffer(2)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                      //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_DAY_REG
        writeBuf[1] = bcdDay                                        //Send new value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC                         //Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**Read day from RTC*/
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_read_day 
    //% block="Read Day as Number"
    //% weight=45 blockGap=8
    export function readDay(): number {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        //read Values
        kitronik_RTC.readValue()

        let decDay = kitronik_RTC.bcdToDec(kitronik_RTC.currentDay, kitronik_RTC.RTC_DAY_REG)                  //Convert number to Decimal

        return decDay
    }

    /**
     * set the month on the RTC
     * @param writeMonth is to set the month in terms of numbers 1 to 12
    */
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_write_month 
    //% block="Set Month to %month|month"
    //% month.min=1 month.max=12
    //% weight=40 blockGap=8
    export function writeMonth(month: number): void {
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        let bcdMonth = kitronik_RTC.decToBcd(month)
        let writeBuf = pins.createBuffer(2)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                      //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_MONTH_REG
        writeBuf[1] = bcdMonth                                      //Send new value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC                                     //Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**Read month from RTC*/
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_read_month 
    //% block="Read Month as Number"
    //% weight=35 blockGap=8
    export function readMonth(): number {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        //read Values
        kitronik_RTC.readValue()

        //pins.i2cReadBuffer(kitronik_RTC.CHIP_ADDRESS, buf, false)
        let decMonths = kitronik_RTC.bcdToDec(kitronik_RTC.currentMonth, kitronik_RTC.RTC_MONTH_REG)                   //Convert number to Decimal

        return decMonths
    }

    /**
     * set the year on the RTC
     * @param writeYear is to set the year in terms of numbers 0 to 99
    */
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_write_year 
    //% block="Set Year to %year|year"
    //% year.min=0 year.max=99
    //% weight=30 blockGap=8
    export function writeYear(year: number): void {
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        let bcdYear = kitronik_RTC.decToBcd(year)                                //Convert number to BCD
        let writeBuf = pins.createBuffer(2)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                      //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_YEAR_REG
        writeBuf[1] = bcdYear                                       //Send new value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC                                 //Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**Read year from RTC*/
    //% subcategory="RTC more..."
    //% blockId=kitronik_halo_hd_read_year 
    //% block="Read Year as Number"
    //% weight=25 blockGap=8
    export function readYear(): number {
        
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        
        //read Values
        kitronik_RTC.readValue()

        let decYears = kitronik_RTC.bcdToDec(kitronik_RTC.currentYear, kitronik_RTC.RTC_YEAR_REG)                  //Convert number to Decimal

        return decYears
    }
} 