var viewing3d = true;
var toggleHover = false;

function toggle3d() {

	var basic = document.getElementById('basic');
	basic.style.visibility = ( basic.style.visibility == 'visible' ? 'hidden' : 'visible' );
	basic.style.zIndex = ( basic.style.zIndex == '999' ? '-1' : '999' );
	
	document.getElementById('contact').style.visibility = 'hidden';
	
	var mainAnimation = document.getElementById('mainAnimation');
	mainAnimation.style.visibility = ( mainAnimation.style.visibility == 'visible' || mainAnimation.style.visibility == '' ? 'hidden' : 'visible' );
	mainAnimation.style.zIndex = ( mainAnimation.style.zIndex == '999' ? '-1' : '999' );
	
	viewing3d = mainAnimation.style.visibility == 'visible';

}

function toggleContact() {

	var c = document.getElementById('contact');
	c.style.visibility = ( c.style.visibility == 'visible' ? 'hidden' : 'visible' );

}

function toggle3dHover() {

	toggleHover = !toggleHover;

}