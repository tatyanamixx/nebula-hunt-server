module.exports = class UserDto {
	id;
	role;

	constructor(model) {
		this.id = model.id;
		this.role = model.role;
	}
};
