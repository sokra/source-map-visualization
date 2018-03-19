* {
  box-sizing: border-box; }

html, body {
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
  font-family: 'Helvetica', 'Verdana', sans-serif;
  font-weight: 400;
  font-display: optional;
  color: #444; }

html {
  overflow: hidden; }

body {
  flex-direction: column;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex: 1;
  flex-wrap: nowrap;
  background: #ececec; }

.header {
  width: 100%;
  min-height: 56px;
  color: #fff;
  background: #301e80;
  position: fixed;
  font-size: 20px;
  padding: 16px 16px 0 16px;
  will-change: transform;
  flex-direction: row;
  flex-flow: row wrap;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex: 1;
  transition: transform 0.233s cubic-bezier(0, 0, 0.21, 1) 0.1s;
  z-index: 1000; }
  .header .headerButton {
    width: 24px;
    height: 24px;
    margin-right: 16px;
    text-indent: -30000px;
    overflow: hidden;
    opacity: 0.54;
    transition: opacity 0.333s cubic-bezier(0, 0, 0.21, 1);
    border: none;
    outline: none;
    cursor: pointer; }
  .header .butRefresh {
    background: url(/images/ic_refresh_white_24px.svg) center center no-repeat; }
  .header .butAdd {
    background: url(/images/ic_add_white_24px.svg) center center no-repeat; }

.header__title {
  font-weight: 400;
  font-size: 20px;
  margin: 0;
  flex: 1; }

.loader {
  left: 50%;
  top: 50%;
  position: fixed;
  transform: translate(-50%, -50%); }
  .loader .spinner {
    box-sizing: border-box;
    stroke: #673AB7;
    stroke-width: 3px;
    transform-origin: 50%;
    animation: line 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite, rotate 1.6s linear infinite; }

@keyframes rotate {
  from {
    transform: rotate(0); }
  to {
    transform: rotate(450deg); } }

@keyframes line {
  0% {
    stroke-dasharray: 2, 85.964;
    transform: rotate(0); }
  50% {
    stroke-dasharray: 65.973, 21.9911;
    stroke-dashoffset: 0; }
  100% {
    stroke-dasharray: 2, 85.964;
    stroke-dashoffset: -65.973;
    transform: rotate(90deg); } }

.main {
  padding-top: 60px;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; }

.dialog-container {
  background: rgba(0, 0, 0, 0.57);
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  will-change: opacity;
  transition: opacity 0.333s cubic-bezier(0, 0, 0.21, 1); }

.dialog-container--visible {
  opacity: 1;
  pointer-events: auto; }

.dialog {
  background: #FFF;
  border-radius: 2px;
  box-shadow: 0 0 14px rgba(0, 0, 0, 0.24), 0 14px 28px rgba(0, 0, 0, 0.48);
  min-width: 280px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) translateY(30px);
  transition: transform 0.333s cubic-bezier(0, 0, 0.21, 1) 0.05s;
  padding: 24px;
  font-size: 30px; }
  .dialog select, .dialog button {
    font-size: 20px; }

.card {
  padding: 16px;
  position: relative;
  box-sizing: border-box;
  background: #fff;
  border-radius: 2px;
  margin: 16px;
  box-shadow: 0 3px 1px 1px rgba(0, 0, 0, 0.2);
  border-color: #eee;
  border-width: 1px;
  border-style: solid; }

/* TODO: use variable for smaller icon, too. */
.weather-forecast .current .icon {
  width: 96px;
  height: 96px; }

.weather-forecast .future .icon {
  width: 32px;
  height: 32px; }

.weather-forecast .current {
  display: flex; }
  .weather-forecast .current .visual {
    display: flex;
    font-size: 2em; }
    .weather-forecast .current .visual .scale {
      font-size: 0.5em;
      vertical-align: super; }
  .weather-forecast .current .visual, .weather-forecast .current .description {
    flex-grow: 1; }
  .weather-forecast .current .feels-like:before {
    content: "Feels like: ";
    color: #888; }
  .weather-forecast .current .wind:before {
    content: "Wind: ";
    color: #888; }
  .weather-forecast .current .precip:before {
    content: "Precipitation: ";
    color: #888; }
  .weather-forecast .current .humidity:before {
    content: "Humidity: ";
    color: #888; }
  .weather-forecast .current .pollen:before {
    content: "Pollen Count: ";
    color: #888; }
  .weather-forecast .current .pcount:before {
    content: "Pollen ";
    color: #888; }

.weather-forecast .location {
  font-size: 1.35em; }

.weather-forecast .date, .weather-forecast .description {
  font-size: 0.7em; }

.weather-forecast .future {
  display: flex; }
  .weather-forecast .future .oneday {
    flex-grow: 1;
    text-align: center; }
    .weather-forecast .future .oneday .icon {
      margin-left: auto;
      margin-right: auto; }
    .weather-forecast .future .oneday .temp-high, .weather-forecast .future .oneday .temp-low {
      display: inline-block; }
    .weather-forecast .future .oneday .temp-low {
      color: #888; }

.weather-forecast .icon {
  background-repeat: no-repeat;
  background-size: contain; }
  .weather-forecast .icon.clear-day {
    background-image: url("/images/clear.png"); }
  .weather-forecast .icon.clear-night {
    background-image: url("/images/clear.png"); }
  .weather-forecast .icon.rain {
    background-image: url("/images/rain.png"); }
  .weather-forecast .icon.snow {
    background-image: url("/images/snow.png"); }
  .weather-forecast .icon.sleet {
    background-image: url("/images/sleet.png"); }
  .weather-forecast .icon.wind {
    background-image: url("/images/wind.png"); }
  .weather-forecast .icon.fog {
    background-image: url("/images/fog.png"); }
  .weather-forecast .icon.cloudy {
    background-image: url("/images/cloudy.png"); }
  .weather-forecast .icon.partly-cloudy-day {
    background-image: url("/images/partly-cloudy.png"); }
  .weather-forecast .icon.partly-cloudy-night {
    background-image: url("/images/partly-cloudy.png"); }
  .weather-forecast .icon.thunderstorms {
    background-image: url("/images/thunderstorms.png"); }

@media (min-width: 360px) {
  .weather-forecast .location {
    font-size: 2.25em; }
  .weather-forecast .date, .weather-forecast .description {
    font-size: 0.9em; }
  .weather-forecast .current .visual {
    font-size: 3em; } }

@media (min-width: 500px) {
  .weather-forecast .date, .weather-forecast .description {
    font-size: 1.25em; }
  .weather-forecast .location {
    font-size: 2.45em; }
  .weather-forecast .current .icon {
    width: 128px;
    height: 128px; }
  .weather-forecast .current .visual {
    font-size: 4em; }
  .weather-forecast .future .oneday .icon {
    width: 64px;
    height: 64px; } }

@media (min-width: 1015px) {
  .main {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    align-content: flex-start; }
  .card {
    flex: 1 1 auto;
    max-width: calc(50% - 32px); } }

footer {
  width: 100%;
  height: 26px;
  background: #301e80;
  position: fixed;
  font-size: 20px;
  bottom: 0;
  will-change: transform;
  transition: transform 0.233s cubic-bezier(0, 0, 0.21, 1) 0.1s;
  z-index: 1000; }

/*# sourceMappingURL=looks.css.map */
