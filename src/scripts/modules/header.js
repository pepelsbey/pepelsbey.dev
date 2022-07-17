const header = document.querySelector('.header');
const shifter = document.createElement('div');

header.insertAdjacentElement('beforebegin', shifter);

header.style.position = 'sticky';
header.style.top = 'calc(var(--computed-height) * -1 - 1px)';
header.style.bottom = 'calc(100% - var(--computed-height))';

function fixHeaderoffset() {
    const bounds = header.getBoundingClientRect();
    header.style.setProperty('--computed-height', bounds.height + 'px');

    const y = header.offsetTop;
    shifter.style.height = y + 'px';
    header.style.marginBottom = -y + 'px';
}

addEventListener('scroll', () => fixHeaderoffset());
addEventListener('resize', () => fixHeaderoffset());

fixHeaderoffset();
