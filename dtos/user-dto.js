/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
module.exports = class UserDto {
	id;
	role;

	constructor(model) {
		this.id = String(model.id);
		this.role = model.role;
	}
};
