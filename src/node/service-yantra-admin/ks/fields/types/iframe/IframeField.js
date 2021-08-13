import Field from '../Field';
import React from 'react';

module.exports = Field.create({
	displayName: 'IframeField',
	statics: {
		type: 'Iframe',
	},
	renderField() {
		let src = "data:text/html;charset=utf-8," + encodeURIComponent(this.props.value);
		return <iframe width={800} height={800} src={src}/>
	}
});
